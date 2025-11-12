/**
 * Client-side PDF to Image Extractor
 * Uses PDF.js - works on Vercel!
 */

import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ExtractedPage {
  pageNumber: number;
  imageDataUrl: string;
  width: number;
  height: number;
}

export async function extractPagesFromPDF(
  pdfFile: File,
  options: { scale?: number; format?: 'png' | 'jpeg'; quality?: number } = {}
): Promise<ExtractedPage[]> {
  const { scale = 2, format = 'png', quality = 0.92 } = options;
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport } as any).promise;

    const imageDataUrl = canvas.toDataURL(
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    );

    pages.push({
      pageNumber: pageNum,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
