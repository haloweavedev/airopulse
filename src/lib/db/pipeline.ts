import { getDb } from '../db';
import type { PipelineRun } from '../types';

export async function createPipelineRun(data: {
  project_id: string;
  step: string;
  model_used: string;
}): Promise<PipelineRun> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO pipeline_runs (project_id, step, status, model_used)
    VALUES (${data.project_id}, ${data.step}, 'running', ${data.model_used})
    RETURNING *
  `;
  return rows[0] as PipelineRun;
}

export async function completePipelineRun(id: string, data: {
  status: string;
  input_tokens?: number;
  output_tokens?: number;
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}) {
  const sql = getDb();
  await sql`
    UPDATE pipeline_runs
    SET status = ${data.status},
        input_tokens = ${data.input_tokens ?? 0},
        output_tokens = ${data.output_tokens ?? 0},
        duration_ms = ${data.duration_ms ?? 0},
        error_message = ${data.error_message ?? null},
        metadata = ${data.metadata ? JSON.stringify(data.metadata) : null},
        completed_at = now()
    WHERE id = ${id}
  `;
}

export async function listPipelineRuns(projectId: string): Promise<PipelineRun[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM pipeline_runs WHERE project_id = ${projectId} ORDER BY created_at DESC
  `;
  return rows as PipelineRun[];
}
