import { getDb } from '../db';
import type { Feature } from '../types';

export async function listFeatures(projectId: string): Promise<Feature[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM features WHERE project_id = ${projectId} ORDER BY impact DESC, created_at ASC
  `;
  return rows as Feature[];
}

export async function createFeature(data: {
  project_id: string;
  title: string;
  description: string;
  impact?: string;
  effort?: string;
  pain_point_ids?: string[];
  evidence_summary?: string;
}): Promise<Feature> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO features (project_id, title, description, impact, effort, pain_point_ids, evidence_summary)
    VALUES (${data.project_id}, ${data.title}, ${data.description}, ${data.impact ?? 'medium'}, ${data.effort ?? 'medium'}, ${data.pain_point_ids ?? []}, ${data.evidence_summary ?? ''})
    RETURNING *
  `;
  return rows[0] as Feature;
}

export async function deleteFeatures(projectId: string) {
  const sql = getDb();
  await sql`DELETE FROM features WHERE project_id = ${projectId}`;
}
