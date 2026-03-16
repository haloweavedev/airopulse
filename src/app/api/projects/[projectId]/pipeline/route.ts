import { NextResponse } from 'next/server';
import { getProject, updateProjectStatus } from '@/lib/db/projects';
import { listDocuments } from '@/lib/db/documents';
import { createCompetitor } from '@/lib/db/competitors';
import { createQuery, listQueries, updateQuery } from '@/lib/db/queries';
import { upsertThread, getThreadsForAnalysis, updateThreadStatus } from '@/lib/db/threads';
import { createInsight, listInsights } from '@/lib/db/insights';
import { createPipelineRun, completePipelineRun } from '@/lib/db/pipeline';
import { summarizeDocuments } from '@/lib/ai/summarize';
import { identifyCompetitors } from '@/lib/ai/competitors';
import { analyzeThread } from '@/lib/ai/analyze-thread';
import { synthesizeReport } from '@/lib/ai/synthesize';
import { searchReddit } from '@/lib/reddit/search';
import { fetchThreadJson } from '@/lib/reddit/fetch-thread';
import { errorResponse } from '@/lib/api-error';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { step } = body;

  try {
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    switch (step) {
      case 'summarize':
        return await runSummarize(projectId);
      case 'competitors':
        return await runCompetitors(projectId);
      case 'mine':
        return await runMine(projectId);
      case 'analyze':
        return await runAnalyze(projectId);
      case 'synthesize':
        return await runSynthesize(projectId);
      default:
        return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
    }
  } catch (error) {
    console.error(`Pipeline step "${step}" failed:`, error);
    await updateProjectStatus(projectId, 'error', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse(error);
  }
}

async function runSummarize(projectId: string) {
  await updateProjectStatus(projectId, 'summarizing');
  const run = await createPipelineRun({ project_id: projectId, step: 'summarize', model_used: 'gpt-4.1' });
  const start = Date.now();

  const documents = await listDocuments(projectId);
  if (documents.length === 0) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No documents uploaded' });
    await updateProjectStatus(projectId, 'draft', { error_message: 'Upload documents first' });
    return NextResponse.json({ error: 'No documents uploaded' }, { status: 400 });
  }

  const result = await summarizeDocuments(documents.map((d) => ({ name: d.name, raw_text: d.raw_text })));

  await updateProjectStatus(projectId, 'draft', { product_summary: result.summary });
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: result.usage?.prompt_tokens ?? 0,
    output_tokens: result.usage?.completion_tokens ?? 0,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({ summary: result.summary });
}

async function runCompetitors(projectId: string) {
  await updateProjectStatus(projectId, 'identifying_competitors');
  const run = await createPipelineRun({ project_id: projectId, step: 'competitors', model_used: 'gpt-4.1' });
  const start = Date.now();

  const project = await getProject(projectId);
  if (!project?.product_summary) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No product summary' });
    await updateProjectStatus(projectId, 'draft', { error_message: 'Run summarize step first' });
    return NextResponse.json({ error: 'No product summary. Run summarize step first.' }, { status: 400 });
  }

  const result = await identifyCompetitors(project.product_summary);

  for (const comp of result.competitors) {
    await createCompetitor({
      project_id: projectId,
      name: comp.name,
      description: comp.description,
      website: comp.website,
      is_primary: comp.is_primary,
    });
  }

  for (const q of result.queries) {
    await createQuery({ project_id: projectId, query: q, source: 'ai' });
  }

  // Pause after this step — user reviews competitors/queries
  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: result.usage?.prompt_tokens ?? 0,
    output_tokens: result.usage?.completion_tokens ?? 0,
    duration_ms: Date.now() - start,
    metadata: { competitors_count: result.competitors.length, queries_count: result.queries.length },
  });

  return NextResponse.json({
    competitors: result.competitors.length,
    queries: result.queries.length,
  });
}

async function runMine(projectId: string) {
  await updateProjectStatus(projectId, 'mining');
  const run = await createPipelineRun({ project_id: projectId, step: 'mine', model_used: 'reddit-api' });
  const start = Date.now();

  const queries = await listQueries(projectId);
  const activeQueries = queries.filter((q) => q.is_active);

  if (activeQueries.length === 0) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No active queries' });
    await updateProjectStatus(projectId, 'draft', { error_message: 'No active search queries' });
    return NextResponse.json({ error: 'No active search queries' }, { status: 400 });
  }

  let totalThreads = 0;

  for (const q of activeQueries) {
    const results = await searchReddit(q.query);

    // Fetch full thread data for top 5 per query
    const topResults = results.slice(0, 5);
    for (const post of topResults) {
      try {
        const threadJson = await fetchThreadJson(post.permalink);
        await upsertThread({
          project_id: projectId,
          query_id: q.id,
          reddit_id: post.reddit_id,
          subreddit: post.subreddit,
          title: post.title,
          selftext: post.selftext,
          url: post.url,
          permalink: post.permalink,
          score: post.score,
          num_comments: post.num_comments,
          thread_json: threadJson as Record<string, unknown>,
        });
        totalThreads++;
      } catch (err) {
        console.error(`Failed to fetch thread ${post.permalink}:`, err);
      }
    }

    await updateQuery(q.id, {
      results_count: topResults.length,
      last_searched: new Date().toISOString(),
    });
  }

  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    duration_ms: Date.now() - start,
    metadata: { total_threads: totalThreads, queries_searched: activeQueries.length },
  });

  return NextResponse.json({ threads_mined: totalThreads });
}

async function runAnalyze(projectId: string) {
  await updateProjectStatus(projectId, 'analyzing');
  const run = await createPipelineRun({ project_id: projectId, step: 'analyze', model_used: 'gpt-4.1-mini' });
  const start = Date.now();

  const project = await getProject(projectId);
  if (!project?.product_summary) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No product summary' });
    return NextResponse.json({ error: 'No product summary' }, { status: 400 });
  }

  const threads = await getThreadsForAnalysis(projectId, 10);
  if (threads.length === 0) {
    await completePipelineRun(run.id, { status: 'complete', duration_ms: Date.now() - start, metadata: { message: 'No pending threads' } });
    await updateProjectStatus(projectId, 'draft');
    return NextResponse.json({ analyzed: 0, message: 'No pending threads to analyze' });
  }

  let totalInsights = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const thread of threads) {
    try {
      const result = await analyzeThread(
        {
          title: thread.title,
          subreddit: thread.subreddit,
          selftext: thread.selftext,
          score: thread.score,
          thread_json: thread.thread_json,
        },
        project.product_summary
      );

      for (const insight of result.insights) {
        await createInsight({
          project_id: projectId,
          thread_id: thread.id,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          evidence: insight.evidence,
          intensity: insight.intensity,
          frequency: insight.frequency,
          tags: insight.tags,
        });
        totalInsights++;
      }

      totalInputTokens += result.usage?.prompt_tokens ?? 0;
      totalOutputTokens += result.usage?.completion_tokens ?? 0;
      await updateThreadStatus(thread.id, 'analyzed');
    } catch (err) {
      console.error(`Failed to analyze thread ${thread.id}:`, err);
      await updateThreadStatus(thread.id, 'error');
    }
  }

  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    duration_ms: Date.now() - start,
    metadata: { threads_analyzed: threads.length, insights_extracted: totalInsights },
  });

  return NextResponse.json({
    threads_analyzed: threads.length,
    insights_extracted: totalInsights,
    has_more: (await getThreadsForAnalysis(projectId, 1)).length > 0,
  });
}

async function runSynthesize(projectId: string) {
  await updateProjectStatus(projectId, 'synthesizing');
  const run = await createPipelineRun({ project_id: projectId, step: 'synthesize', model_used: 'gpt-4.1' });
  const start = Date.now();

  const project = await getProject(projectId);
  if (!project?.product_summary) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No product summary' });
    return NextResponse.json({ error: 'No product summary' }, { status: 400 });
  }

  const insights = await listInsights(projectId);
  if (insights.length === 0) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No insights to synthesize' });
    await updateProjectStatus(projectId, 'draft', { error_message: 'No insights. Run analyze step first.' });
    return NextResponse.json({ error: 'No insights to synthesize' }, { status: 400 });
  }

  const result = await synthesizeReport(insights, project.product_summary);

  await updateProjectStatus(projectId, 'complete', { final_report: result.report });
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: result.usage?.prompt_tokens ?? 0,
    output_tokens: result.usage?.completion_tokens ?? 0,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({ report: result.report });
}
