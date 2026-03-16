import { getDb } from '../db';
import type { Insight } from '../types';

export async function listInsights(
  projectId: string,
  filters?: { category?: string; intensity?: string },
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<Insight[]> {
  const sql = getDb();

  if (filters?.category && filters?.intensity) {
    return await sql`
      SELECT * FROM insights WHERE project_id = ${projectId} AND category = ${filters.category} AND intensity = ${filters.intensity}
      ORDER BY frequency DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as Insight[];
  }
  if (filters?.category) {
    return await sql`
      SELECT * FROM insights WHERE project_id = ${projectId} AND category = ${filters.category}
      ORDER BY frequency DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as Insight[];
  }
  if (filters?.intensity) {
    return await sql`
      SELECT * FROM insights WHERE project_id = ${projectId} AND intensity = ${filters.intensity}
      ORDER BY frequency DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as Insight[];
  }

  return await sql`
    SELECT * FROM insights WHERE project_id = ${projectId}
    ORDER BY frequency DESC, created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  ` as Insight[];
}

export async function createInsight(data: {
  project_id: string;
  thread_id: string;
  category: string;
  title: string;
  description: string;
  evidence?: string;
  intensity?: string;
  frequency?: number;
  tags?: string[];
}): Promise<Insight> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO insights (project_id, thread_id, category, title, description, evidence, intensity, frequency, tags)
    VALUES (${data.project_id}, ${data.thread_id}, ${data.category}, ${data.title}, ${data.description}, ${data.evidence ?? null}, ${data.intensity ?? 'medium'}, ${data.frequency ?? 1}, ${data.tags ?? []})
    RETURNING *
  `;
  return rows[0] as Insight;
}
