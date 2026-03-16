import { NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/db/projects';
import { errorResponse } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const projects = await listProjects({ limit, offset });
    return NextResponse.json(projects);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const project = await createProject(name.trim(), description?.trim());
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
