import { NextResponse } from 'next/server';
import { listQueries, createQuery, updateQuery, deleteQuery } from '@/lib/db/queries';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const queries = await listQueries(projectId);
    return NextResponse.json(queries);
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
    const query = await createQuery({ project_id: projectId, query: body.query, source: body.source || 'manual' });
    return NextResponse.json(query, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Query ID required' }, { status: 400 });
    }
    await updateQuery(id, data);
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
      return NextResponse.json({ error: 'Query ID required' }, { status: 400 });
    }
    await deleteQuery(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
