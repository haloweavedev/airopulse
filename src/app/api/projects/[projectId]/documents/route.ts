import { NextResponse } from 'next/server';
import { listDocuments, createDocument, deleteDocument } from '@/lib/db/documents';
import { extractText } from '@/lib/file-processing/extract-text';
import { errorResponse } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const documents = await listDocuments(projectId);
    return NextResponse.json(documents);
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
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const results = [];

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { text, type } = await extractText(buffer, file.name);
        const doc = await createDocument({
          project_id: projectId,
          name: file.name,
          type,
          raw_text: text,
          size_bytes: buffer.length,
        });
        results.push(doc);
      }

      return NextResponse.json(results, { status: 201 });
    }

    // Handle pasted text
    const body = await request.json();
    const { name, text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const doc = await createDocument({
      project_id: projectId,
      name: name || 'Pasted text',
      type: 'paste',
      raw_text: text,
      size_bytes: Buffer.byteLength(text, 'utf-8'),
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');
    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }
    await deleteDocument(docId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
