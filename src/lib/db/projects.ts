import { getDb } from '../db';
import type { Project, ProjectStatus, ProjectWithCounts } from '../types';

export async function listProjects(
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<ProjectWithCounts[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT p.*,
      COALESCE(d.cnt, 0)::int AS document_count,
      COALESCE(i.cnt, 0)::int AS insight_count
    FROM projects p
    LEFT JOIN (SELECT project_id, COUNT(*) AS cnt FROM documents GROUP BY project_id) d ON d.project_id = p.id
    LEFT JOIN (SELECT project_id, COUNT(*) AS cnt FROM insights GROUP BY project_id) i ON i.project_id = p.id
    ORDER BY p.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as ProjectWithCounts[];
}

export async function getProject(id: string): Promise<Project | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return (rows[0] as Project) ?? null;
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO projects (name, description)
    VALUES (${name}, ${description ?? null})
    RETURNING *
  `;
  return rows[0] as Project;
}

export async function updateProjectStatus(id: string, status: ProjectStatus, extra?: { product_summary?: string; final_report?: string; error_message?: string }) {
  const sql = getDb();
  await sql`
    UPDATE projects
    SET status = ${status},
        product_summary = COALESCE(${extra?.product_summary ?? null}, product_summary),
        final_report = COALESCE(${extra?.final_report ?? null}, final_report),
        error_message = COALESCE(${extra?.error_message ?? null}, error_message),
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteProject(id: string) {
  const sql = getDb();
  await sql`DELETE FROM projects WHERE id = ${id}`;
}
