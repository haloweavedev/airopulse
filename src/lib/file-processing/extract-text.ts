export async function extractText(buffer: Buffer, filename: string): Promise<{ text: string; type: string }> {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.docx')) {
    const { extractDocx } = await import('./docx');
    const text = await extractDocx(buffer);
    return { text, type: 'docx' };
  }

  if (lower.endsWith('.pdf')) {
    const { extractPdf } = await import('./pdf');
    const text = await extractPdf(buffer);
    return { text, type: 'pdf' };
  }

  if (lower.endsWith('.txt') || lower.endsWith('.md')) {
    return { text: buffer.toString('utf-8'), type: 'txt' };
  }

  return { text: buffer.toString('utf-8'), type: 'txt' };
}
