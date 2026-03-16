import { getDb } from '../db';
import type { RedditThread } from '../types';

export async function listThreads(
  projectId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<Omit<RedditThread, 'thread_json'>[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id, query_id, reddit_id, subreddit, title, selftext, url, permalink, score, num_comments, analysis_status, created_at
    FROM reddit_threads
    WHERE project_id = ${projectId}
    ORDER BY score DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as Omit<RedditThread, 'thread_json'>[];
}

export async function getThreadsForAnalysis(projectId: string, limit = 10): Promise<RedditThread[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM reddit_threads
    WHERE project_id = ${projectId} AND analysis_status = 'pending'
    ORDER BY num_comments DESC
    LIMIT ${limit}
  `;
  return rows as RedditThread[];
}

export async function upsertThread(data: {
  project_id: string;
  query_id: string;
  reddit_id: string;
  subreddit: string;
  title: string;
  selftext?: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  thread_json: Record<string, unknown>;
}): Promise<RedditThread> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO reddit_threads (project_id, query_id, reddit_id, subreddit, title, selftext, url, permalink, score, num_comments, thread_json)
    VALUES (${data.project_id}, ${data.query_id}, ${data.reddit_id}, ${data.subreddit}, ${data.title}, ${data.selftext ?? null}, ${data.url}, ${data.permalink}, ${data.score}, ${data.num_comments}, ${JSON.stringify(data.thread_json)})
    ON CONFLICT (project_id, reddit_id) DO UPDATE SET
      score = EXCLUDED.score,
      num_comments = EXCLUDED.num_comments,
      thread_json = EXCLUDED.thread_json
    RETURNING *
  `;
  return rows[0] as RedditThread;
}

export async function updateThreadStatus(id: string, status: string) {
  const sql = getDb();
  await sql`UPDATE reddit_threads SET analysis_status = ${status} WHERE id = ${id}`;
}
