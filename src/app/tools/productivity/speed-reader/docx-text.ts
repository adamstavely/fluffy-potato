import mammoth from 'mammoth';

/**
 * Extract plain text from a .docx file in the browser (no server).
 * Complex layouts may not match what you see in Word.
 */
export async function extractTextFromDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.replace(/\r\n/g, '\n').trim();
}
