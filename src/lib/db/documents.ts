import { getDb } from '../db';
import type { Document } from '../types';

export async function listDocuments(projectId: string): Promise<Document[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM documents WHERE project_id = ${projectId} ORDER BY created_at DESC
  `;
  return rows as Document[];
}

export async function createDocument(data: {
  project_id: string;
  name: string;
  type: string;
  raw_text: string;
  size_bytes: number;
}): Promise<Document> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO documents (project_id, name, type, raw_text, size_bytes)
    VALUES (${data.project_id}, ${data.name}, ${data.type}, ${data.raw_text}, ${data.size_bytes})
    RETURNING *
  `;
  return rows[0] as Document;
}

export async function deleteDocument(id: string) {
  const sql = getDb();
  await sql`DELETE FROM documents WHERE id = ${id}`;
}
