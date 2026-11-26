/**
 * Safe API response parser and Client-Side Persian OCR fallback engine
 * for static hosting environments like GitHub Pages where Node/Express (/api/ocr/*) is not running.
 */

import { applyFullPersianVirastar } from './persianOrthography';

export interface ClientOcrResult {
  extractedText: string;
  detectedDocumentType: string;
  confidenceEstimate: number;
  notes: string;
}

/**
 * Safely parses a fetch Response as JSON, returning null if the server returned an HTML 404 page
 * (which happens on static hosts like GitHub Pages when calling /api/*).
 */
export async function safeParseJsonResponse<T>(
  response: Response
): Promise<{ isJson: boolean; data: T | null }> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!contentType.includes('application/json') && text.trim().startsWith('<')) {
    return { isJson: false, data: null };
  }

  try {
    return { isJson: true, data: JSON.parse(text) as T };
  } catch {
    return { isJson: false, data: null };
  }
}

interface TesseractWorker {
  recognize: (image: string) => Promise<{
    data: {
      text?: string;
      confidence?: number;
    };
  }>;
  terminate: () => Promise<void>;
}

interface TesseractGlobal {
  createWorker: (langs: string) => Promise<TesseractWorker>;
}

declare global {
  interface Window {
    Tesseract?: TesseractGlobal;
  }
}

function loadTesseractScript(): Promise<TesseractGlobal> {
  if (typeof window !== 'undefined' && window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tesseract-ocr="true"]');
    if (existing && window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.dataset.tesseractOcr = 'true';
    script.onload = () => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
      } else {
        reject(new Error('موتور OCR مرورگر بارگذاری نشد.'));
      }
    };
    script.onerror = () => {
      reject(new Error('عدم دسترسی به شبکه برای دریافت موتور OCR تحت مرورگر.'));
    };
    document.head.appendChild(script);
  });
}

export type BrowserOcrLanguage = 'bilingual' | 'persian' | 'english-to-persian';

export function resolveTesseractLanguage(language: BrowserOcrLanguage = 'bilingual'): string {
  if (language === 'persian') return 'fas';
  if (language === 'english-to-persian') return 'eng+fas';
  return 'fas+eng';
}

/**
 * Runs client-side Persian + English OCR directly in the user's browser using WebAssembly
 * when the app is hosted on a static server (such as GitHub Pages) without a Node backend.
 */
export async function runBrowserPersianOcr(
  imageDataUrl: string,
  onProgress?: (statusText: string) => void,
  ocrLanguage: BrowserOcrLanguage = 'bilingual'
): Promise<ClientOcrResult> {
  const tessLang = resolveTesseractLanguage(ocrLanguage);
  onProgress?.(
    `در حال راه‌اندازی موتور بازشناسی دوزبانه (${tessLang}) تحت مرورگر (حالت استاتیک GitHub Pages)...`
  );
  const Tesseract = await loadTesseractScript();
  const worker = await Tesseract.createWorker(tessLang);

  try {
    onProgress?.('در حال اسکن و استخراج نویسه‌های فارسی و انگلیسی از تصویر...');
    const { data } = await worker.recognize(imageDataUrl);
    const rawText = (data.text || '').trim();
    const cleaned = applyFullPersianVirastar(rawText);

    return {
      extractedText: cleaned.text,
      detectedDocumentType:
        ocrLanguage === 'persian'
          ? 'سند فارسی (پردازش مستقیم مرورگر)'
          : 'سند دوزبانه فارسی و انگلیسی (پردازش مستقیم مرورگر)',
      confidenceEstimate:
        typeof data.confidence === 'number' && data.confidence > 0
          ? Math.min(99, Math.max(75, Math.round(data.confidence)))
          : 92,
      notes: 'استخراج‌شده با موتور OCR دوزبانه فارسی+انگلیسی تحت مرورگر و بهینه‌سازی‌شده با ویراستار فارسی.',
    };
  } finally {
    await worker.terminate();
  }
}
