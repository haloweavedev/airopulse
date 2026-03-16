import { getDb } from '../db';
import type { SearchQuery } from '../types';

export async function listQueries(projectId: string): Promise<SearchQuery[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM search_queries WHERE project_id = ${projectId} ORDER BY created_at ASC
  `;
  return rows as SearchQuery[];
}

export async function createQuery(data: {
  project_id: string;
  query: string;
  source?: string;
}): Promise<SearchQuery> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO search_queries (project_id, query, source)
    VALUES (${data.project_id}, ${data.query}, ${data.source ?? 'ai'})
    RETURNING *
  `;
  return rows[0] as SearchQuery;
}

export async function updateQuery(id: string, data: { query?: string; is_active?: boolean; results_count?: number; last_searched?: string }) {
  const sql = getDb();
  await sql`
    UPDATE search_queries
    SET query = COALESCE(${data.query ?? null}, query),
        is_active = COALESCE(${data.is_active ?? null}, is_active),
        results_count = COALESCE(${data.results_count ?? null}, results_count),
        last_searched = COALESCE(${data.last_searched ?? null}, last_searched)
    WHERE id = ${id}
  `;
}

export async function deleteQuery(id: string) {
  const sql = getDb();
  await sql`DELETE FROM search_queries WHERE id = ${id}`;
}
