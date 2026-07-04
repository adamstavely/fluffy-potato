/**
 * Extract plain text from a .docx file in the browser (no server).
 * Complex layouts may not match what you see in Word.
 * `mammoth` is imported lazily so its bundle is only fetched when a .docx is opened.
 */
export async function extractTextFromDocxFile(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.replace(/\r\n/g, '\n').trim();
}
