import { NextResponse } from 'next/server';
import { listFeatures } from '@/lib/db/features';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const features = await listFeatures(projectId);
    return NextResponse.json(features);
  } catch (error) {
    return errorResponse(error);
  }
}
