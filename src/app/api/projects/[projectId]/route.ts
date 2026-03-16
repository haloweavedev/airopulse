import { NextResponse } from 'next/server';
import { getProject, deleteProject } from '@/lib/db/projects';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await deleteProject(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
