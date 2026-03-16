import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { ANALYZE_THREAD_PROMPT } from './prompts';

interface ThreadInsight {
  category: string;
  title: string;
  description: string;
  evidence: string;
  intensity: string;
  frequency: number;
  tags: string[];
}

function extractComments(commentTree: unknown[], depth = 0): { author: string; body: string; score: number }[] {
  const comments: { author: string; body: string; score: number }[] = [];
  if (!Array.isArray(commentTree)) return comments;

  for (const item of commentTree) {
    const i = item as Record<string, unknown>;
    if (i.kind === 't1') {
      const c = i.data as Record<string, unknown>;
      comments.push({
        author: c.author as string,
        body: c.body as string,
        score: c.score as number,
      });
      if (c.replies && typeof c.replies === 'object') {
        const replies = c.replies as Record<string, unknown>;
        if (replies.data && typeof replies.data === 'object') {
          const data = replies.data as Record<string, unknown>;
          if (Array.isArray(data.children)) {
            comments.push(...extractComments(data.children, depth + 1));
          }
        }
      }
    }
  }
  return comments;
}

export async function analyzeThread(thread: {
  title: string;
  subreddit: string;
  selftext: string | null;
  score: number;
  thread_json: Record<string, unknown>;
}, productSummary: string) {
  const openai = getOpenAI();

  // Extract comments from thread JSON
  const threadData = thread.thread_json as unknown as unknown[];
  let comments: { author: string; body: string; score: number }[] = [];
  if (Array.isArray(threadData) && threadData.length > 1) {
    const commentListing = threadData[1] as Record<string, unknown>;
    if (commentListing?.data && typeof commentListing.data === 'object') {
      const data = commentListing.data as Record<string, unknown>;
      if (Array.isArray(data.children)) {
        comments = extractComments(data.children);
      }
    }
  }

  const topComments = comments
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((c) => `[score:${c.score}] ${c.body}`)
    .join('\n---\n');

  const threadContent = `## Thread: ${thread.title}
Subreddit: r/${thread.subreddit} | Score: ${thread.score}
Post: ${thread.selftext || '(link post)'}

Top comments:
${topComments}

---

Product context (what we're building):
${productSummary}`;

  const response = await openai.chat.completions.create({
    model: MODELS.worker,
    messages: [
      { role: 'system', content: ANALYZE_THREAD_PROMPT },
      { role: 'user', content: threadContent },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"insights":[]}';
  const parsed = JSON.parse(content);
  const insights: ThreadInsight[] = parsed.insights || [];

  return {
    insights,
    usage: response.usage,
    model: MODELS.worker,
  };
}
