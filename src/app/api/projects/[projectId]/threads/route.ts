import { NextResponse } from 'next/server';
import { listThreads } from '@/lib/db/threads';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const threads = await listThreads(projectId, { limit, offset });
    return NextResponse.json(threads);
  } catch (error) {
    return errorResponse(error);
  }
}
