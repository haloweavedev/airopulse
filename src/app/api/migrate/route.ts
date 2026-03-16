import { NextResponse } from 'next/server';
import { migrate } from '@/lib/db/migrate';
import { errorResponse } from '@/lib/api-error';

export async function POST() {
  try {
    await migrate();
    return NextResponse.json({ success: true, message: 'Migration complete' });
  } catch (error) {
    return errorResponse(error);
  }
}
