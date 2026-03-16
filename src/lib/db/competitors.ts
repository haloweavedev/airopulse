import { getDb } from '../db';
import type { Competitor } from '../types';

export async function listCompetitors(projectId: string): Promise<Competitor[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM competitors WHERE project_id = ${projectId} ORDER BY is_primary DESC, name ASC
  `;
  return rows as Competitor[];
}

export async function createCompetitor(data: {
  project_id: string;
  name: string;
  description?: string;
  website?: string;
  is_primary?: boolean;
}): Promise<Competitor> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO competitors (project_id, name, description, website, is_primary)
    VALUES (${data.project_id}, ${data.name}, ${data.description ?? null}, ${data.website ?? null}, ${data.is_primary ?? false})
    RETURNING *
  `;
  return rows[0] as Competitor;
}

export async function updateCompetitor(id: string, data: { name?: string; description?: string; website?: string; is_primary?: boolean }) {
  const sql = getDb();
  await sql`
    UPDATE competitors
    SET name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        website = COALESCE(${data.website ?? null}, website),
        is_primary = COALESCE(${data.is_primary ?? null}, is_primary)
    WHERE id = ${id}
  `;
}

export async function deleteCompetitor(id: string) {
  const sql = getDb();
  await sql`DELETE FROM competitors WHERE id = ${id}`;
}
