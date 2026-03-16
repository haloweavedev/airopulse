import { NextResponse } from 'next/server';
import { listCompetitors, createCompetitor, updateCompetitor, deleteCompetitor } from '@/lib/db/competitors';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const competitors = await listCompetitors(projectId);
    return NextResponse.json(competitors);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const competitor = await createCompetitor({ project_id: projectId, ...body });
    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Competitor ID required' }, { status: 400 });
    }
    await updateCompetitor(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Competitor ID required' }, { status: 400 });
    }
    await deleteCompetitor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
