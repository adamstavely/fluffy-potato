import * as pdfjsLib from 'pdfjs-dist';

let workerConfigured = false;

function ensureWorker(baseUri: string): void {
  if (workerConfigured) {
    return;
  }
  const href = new URL('assets/pdfjs/pdf.worker.min.mjs', baseUri).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = href;
  workerConfigured = true;
}

/**
 * Extract plain text from a PDF file in the browser (no server).
 * Quality depends on how text is encoded in the PDF.
 */
export async function extractTextFromPdfFile(file: File, baseUri: string): Promise<string> {
  ensureWorker(baseUri);
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  try {
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const line = textContent.items
        .map((item) => {
          if (item && typeof item === 'object' && 'str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      pageTexts.push(line.replace(/\s+/g, ' ').trim());
    }
    const joined = pageTexts.filter((p) => p.length > 0).join('\n\n');
    return joined.trim();
  } finally {
    await pdf.destroy();
  }
}
