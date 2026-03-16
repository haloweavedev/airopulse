import { NextResponse } from 'next/server';
import { listInsights } from '@/lib/db/insights';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const intensity = searchParams.get('intensity') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const insights = await listInsights(projectId, { category, intensity }, { limit, offset });
    return NextResponse.json(insights);
  } catch (error) {
    return errorResponse(error);
  }
}
