import { NextResponse } from 'next/server';
import { getProject, updateProjectStatus } from '@/lib/db/projects';
import { listDocuments } from '@/lib/db/documents';
import { createCompetitor, listCompetitors } from '@/lib/db/competitors';
import { createQuery, listQueries, updateQuery } from '@/lib/db/queries';
import { upsertThread, getThreadsForAnalysis, updateThreadStatus } from '@/lib/db/threads';
import { createInsight, listInsights } from '@/lib/db/insights';
import { createFeature, deleteFeatures } from '@/lib/db/features';
import { createPipelineRun, completePipelineRun } from '@/lib/db/pipeline';
import { summarizeDocuments } from '@/lib/ai/summarize';
import { researchCompetitors } from '@/lib/ai/competitors';
import { generateRedditQueries } from '@/lib/ai/reddit-queries';
import { extractPainPoints } from '@/lib/ai/analyze-thread';
import { generateFeatures } from '@/lib/ai/synthesize';
import { searchReddit } from '@/lib/reddit/search';
import { fetchThreadJson } from '@/lib/reddit/fetch-thread';
import { errorResponse } from '@/lib/api-error';

export const maxDuration = 60;

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
      case 'pain_points':
      case 'analyze':
        return await runExtractPainPoints(projectId);
      case 'features':
      case 'synthesize':
        return await runGenerateFeatures(projectId);
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

  // Step 1-3: Generate search terms → Tavily search → Structure competitors
  const result = await researchCompetitors(project.product_summary);

  for (const comp of result.competitors) {
    await createCompetitor({
      project_id: projectId,
      name: comp.name,
      description: comp.description,
      website: comp.website ?? undefined,
      source_url: comp.source_url,
      is_primary: comp.is_primary,
    });
  }

  // Step 4: Generate Reddit queries using real competitor names
  const storedCompetitors = await listCompetitors(projectId);
  const queriesResult = await generateRedditQueries(project.product_summary, storedCompetitors);

  for (const q of queriesResult.queries) {
    await createQuery({ project_id: projectId, query: q, source: 'ai' });
  }

  const totalInputTokens = (result.usage.prompt_tokens ?? 0) + (queriesResult.usage?.prompt_tokens ?? 0);
  const totalOutputTokens = (result.usage.completion_tokens ?? 0) + (queriesResult.usage?.completion_tokens ?? 0);

  // Pause after this step — user reviews competitors/queries
  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    duration_ms: Date.now() - start,
    metadata: {
      competitors_count: result.competitors.length,
      queries_count: queriesResult.queries.length,
      search_terms: result.searchTerms,
      raw_results_count: result.rawResultsCount,
    },
  });

  return NextResponse.json({
    competitors: result.competitors.length,
    queries: queriesResult.queries.length,
  });
}

async function runMine(projectId: string) {
  await updateProjectStatus(projectId, 'mining');
  const run = await createPipelineRun({ project_id: projectId, step: 'mine', model_used: 'reddit-api' });
  const start = Date.now();

  const queries = await listQueries(projectId);
  // Only process queries that haven't been searched yet (batch 4 at a time for Vercel timeout)
  const unsearchedQueries = queries.filter((q) => q.is_active && !q.last_searched);
  const batch = unsearchedQueries.slice(0, 4);

  if (batch.length === 0) {
    const activeQueries = queries.filter((q) => q.is_active);
    if (activeQueries.length === 0) {
      await completePipelineRun(run.id, { status: 'error', error_message: 'No active queries' });
      await updateProjectStatus(projectId, 'draft', { error_message: 'No active search queries' });
      return NextResponse.json({ error: 'No active search queries' }, { status: 400 });
    }
    await completePipelineRun(run.id, { status: 'complete', duration_ms: Date.now() - start, metadata: { message: 'All queries already searched' } });
    await updateProjectStatus(projectId, 'draft');
    return NextResponse.json({ threads_mined: 0, message: 'All queries already searched' });
  }

  let totalThreads = 0;
  const queryErrors: string[] = [];

  for (const q of batch) {
    let results;
    try {
      results = await searchReddit(q.query);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queryErrors.push(`"${q.query}": ${msg}`);
      console.error(`searchReddit failed for "${q.query}":`, msg);
      await updateQuery(q.id, { last_searched: new Date().toISOString() });
      continue;
    }

    // Fetch full thread data for top 3 per query (reduced for speed)
    const topResults = results.slice(0, 3);
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

  const hasMore = unsearchedQueries.length > batch.length;

  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    duration_ms: Date.now() - start,
    metadata: {
      total_threads: totalThreads,
      queries_searched: batch.length,
      queries_remaining: unsearchedQueries.length - batch.length,
      query_errors: queryErrors.length > 0 ? queryErrors : undefined,
    },
  });

  return NextResponse.json({
    threads_mined: totalThreads,
    has_more: hasMore,
    ...(queryErrors.length > 0 && { query_errors: queryErrors }),
  });
}

async function runExtractPainPoints(projectId: string) {
  await updateProjectStatus(projectId, 'extracting_pain_points');
  const run = await createPipelineRun({ project_id: projectId, step: 'pain_points', model_used: 'gpt-4.1-mini' });
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
      const result = await extractPainPoints(
        {
          title: thread.title,
          subreddit: thread.subreddit,
          selftext: thread.selftext,
          score: thread.score,
          thread_json: thread.thread_json,
        },
        project.product_summary
      );

      for (const pp of result.painPoints) {
        // Store who_feels_it as a tag prefixed with "who:"
        const tags = [...pp.tags];
        if (pp.who_feels_it) {
          tags.push(`who:${pp.who_feels_it}`);
        }
        if (pp.competitor_mentioned) {
          tags.push(`competitor:${pp.competitor_mentioned}`);
        }

        await createInsight({
          project_id: projectId,
          thread_id: thread.id,
          category: 'pain_point',
          title: pp.title,
          description: pp.description,
          evidence: pp.evidence,
          intensity: pp.intensity,
          frequency: 1,
          tags,
        });
        totalInsights++;
      }

      totalInputTokens += result.usage?.prompt_tokens ?? 0;
      totalOutputTokens += result.usage?.completion_tokens ?? 0;
      await updateThreadStatus(thread.id, 'analyzed');
    } catch (err) {
      console.error(`Failed to extract pain points from thread ${thread.id}:`, err);
      await updateThreadStatus(thread.id, 'error');
    }
  }

  await updateProjectStatus(projectId, 'draft');
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    duration_ms: Date.now() - start,
    metadata: { threads_analyzed: threads.length, pain_points_extracted: totalInsights },
  });

  return NextResponse.json({
    threads_analyzed: threads.length,
    pain_points_extracted: totalInsights,
    has_more: (await getThreadsForAnalysis(projectId, 1)).length > 0,
  });
}

async function runGenerateFeatures(projectId: string) {
  await updateProjectStatus(projectId, 'generating_features');
  const run = await createPipelineRun({ project_id: projectId, step: 'features', model_used: 'gpt-4.1' });
  const start = Date.now();

  const project = await getProject(projectId);
  if (!project?.product_summary) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No product summary' });
    return NextResponse.json({ error: 'No product summary' }, { status: 400 });
  }

  const painPoints = await listInsights(projectId, { category: 'pain_point' });
  if (painPoints.length === 0) {
    await completePipelineRun(run.id, { status: 'error', error_message: 'No pain points to generate features from' });
    await updateProjectStatus(projectId, 'draft', { error_message: 'No pain points. Run extract pain points step first.' });
    return NextResponse.json({ error: 'No pain points to generate features from' }, { status: 400 });
  }

  const competitors = await listCompetitors(projectId);
  const result = await generateFeatures(painPoints, competitors, project.product_summary);

  // Clear old features before storing new ones
  await deleteFeatures(projectId);

  for (const f of result.features) {
    // Map pain_point_indices to actual insight UUIDs
    const painPointIds = (f.pain_point_indices || [])
      .filter((idx: number) => idx >= 0 && idx < painPoints.length)
      .map((idx: number) => painPoints[idx].id);

    await createFeature({
      project_id: projectId,
      title: f.title,
      description: f.description,
      impact: f.impact,
      effort: f.effort,
      pain_point_ids: painPointIds,
      evidence_summary: f.evidence_summary,
    });
  }

  await updateProjectStatus(projectId, 'complete', { final_report: result.report });
  await completePipelineRun(run.id, {
    status: 'complete',
    input_tokens: result.usage?.prompt_tokens ?? 0,
    output_tokens: result.usage?.completion_tokens ?? 0,
    duration_ms: Date.now() - start,
    metadata: { features_generated: result.features.length },
  });

  return NextResponse.json({
    features: result.features.length,
    report: result.report,
  });
}
