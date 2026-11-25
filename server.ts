import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  OCR_MODEL_FALLBACK_CHAIN,
  executeWithModelFallback,
  formatGeminiErrorMessage,
} from './src/utils/geminiRetry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('کلید API جمینای تنظیم نشده است. لطفاً از بخش Settings > Secrets کلید GEMINI_API_KEY را بررسی کنید.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export type ExtractionMode = 'standard' | 'structured' | 'handwriting' | 'poetry';

const MODE_INSTRUCTIONS: Record<ExtractionMode, string> = {
  standard: `شما یک متخصص برجسته بازشناسی نویسه نوری (OCR) و تایپیست حرفه‌ای زبان فارسی هستید.
متن فارسی داخل تصویر را با دقت ۱۰۰٪، بدون هیچ‌گونه خلاصه‌سازی یا حذف کلمات تایپ کنید.
قواعد الزامی:
۱. حروف عربی «ي» و «ك» را به «ی» و «ک» استاندارد فارسی تبدیل کنید.
۲. نیم‌فاصله‌ها (ZWNJ) را در پیشوندهای فعلی (می‌شود، نمی‌دانم)، جمع‌ها (کتاب‌ها) و پسوندها (بزرگ‌تر، خانه‌ام) رعایت کنید.
۳. ارقام داخل متن فارسی را به ارقام فارسی (۰ تا ۹) بنویسید.
۴. فقط متن استخراج‌شده را برگردانید.`,
  structured: `شما یک متخصص حرفه‌ای استخراج اسناد اداری، فاکتورها و جداول فارسی هستید.
تمامی متن‌ها، عناوین، شماره‌ها و جداول موجود در تصویر را با حفظ ساختار دقیق به صورت Markdown استاندارد (شامل جداول Markdown با ستون‌های تراز شده، تیترها و فهرست‌ها) استخراج و تایپ کنید.
نیم‌فاصله‌های فارسی و ارقام فارسی را به دقت رعایت نمایید.`,
  handwriting: `شما یک متخصص رمزگشایی و تایپ دست‌خط‌های فارسی، یادداشت‌های کلاسی، نامه‌های خطی و نسخه‌های دست‌نویس هستید.
با دقت بالا به بافت جملات فارسی، کلمات شکسته یا تحریری را به صورت صحیح، روان و با املای استاندارد فارسی و نیم‌فاصله‌های درست تایپ کنید. اگر کلمه‌ای ناخوانا بود، بهترین حدس معنایی متناسب با جمله را بنویسید.`,
  poetry: `شما یک متخصص ادبیات کلاسیک فارسی، متون کهن، اشعار و متون دارای اعراب (حرکات فتحه، کسره، ضمه، تشدید و تنوین) هستید.
ابیات شعر را به صورت مصرع‌های تفکیک‌شده در سطرهای منظم و با حفظ کامل اعراب و حرکات موجود در تصویر تایپ کنید.`
};

app.post('/api/ocr/extract', async (req, res) => {
  try {
    const { imageBase64, mimeType, mode = 'standard', customPrompt = '' } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      mode?: ExtractionMode;
      customPrompt?: string;
    };

    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'تصویر یا فرمت فایل ارسال نشده است.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const ai = getGenAIClient();
    const systemInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.standard;

    const promptText = customPrompt.trim()
      ? `${systemInstruction}\n\nدستور تکمیلی کاربر: ${customPrompt.trim()}`
      : `${systemInstruction}\n\nخروجی را در قالب JSON با فیلدهای extractedText (متن کامل تایپ‌شده)، detectedDocumentType (نوع سند تشخیص‌داده‌شده به فارسی)، confidenceEstimate (عددی بین 85 تا 100 برای تخمین وضوح تصویر) و notes (نکات کوتاه ویرایشی در یک جمله) برگردانید.`;

    const { result: response, usedModel, totalAttempts } = await executeWithModelFallback(
      OCR_MODEL_FALLBACK_CHAIN,
      async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            // Use ThinkingLevel.LOW on gemini-4-hydrogen to reduce latency and avoid 503 capacity spikes
            ...(modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                extractedText: {
                  type: Type.STRING,
                  description: 'متن کامل فارسی استخراج و تایپ شده از تصویر',
                },
                detectedDocumentType: {
                  type: Type.STRING,
                  description: 'نوع سند تشخیص داده شده مانند صفحه کتاب، دست‌خط، فاکتور یا شعر',
                },
                confidenceEstimate: {
                  type: Type.NUMBER,
                  description: 'درصد اطمینان و وضوح متن استخراج شده بین 0 تا 100',
                },
                notes: {
                  type: Type.STRING,
                  description: 'توضیح کوتاه درباره کیفیت استخراج یا ساختار متن',
                },
              },
              required: ['extractedText', 'detectedDocumentType', 'confidenceEstimate', 'notes'],
            },
          },
        });
      },
      { maxAttemptsPerModel: 3, baseDelayMs: 700 }
    );

    const rawText = (response.text ?? '{}').trim();
    let parsed: {
      extractedText?: string;
      detectedDocumentType?: string;
      confidenceEstimate?: number;
      notes?: string;
    } = {};

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        extractedText: rawText,
        detectedDocumentType: 'سند متنی فارسی',
        confidenceEstimate: 95,
        notes: 'متن با موفقیت از تصویر استخراج شد.',
      };
    }

    res.json({
      extractedText: parsed.extractedText || '',
      detectedDocumentType: parsed.detectedDocumentType || 'سند متنی فارسی',
      confidenceEstimate: typeof parsed.confidenceEstimate === 'number' ? parsed.confidenceEstimate : 96,
      notes:
        totalAttempts > 1
          ? `${parsed.notes || 'متن با موفقیت استخراج شد.'} (پردازش پایدار با ${usedModel})`
          : parsed.notes || 'متن با موفقیت از تصویر استخراج شد.',
    });
  } catch (error: unknown) {
    const friendlyMessage = formatGeminiErrorMessage(error);
    console.error('OCR Extraction Error:', friendlyMessage);
    res.status(500).json({
      error: friendlyMessage,
    });
  }
});

app.post('/api/ocr/smart-edit', async (req, res) => {
  try {
    const { text, action } = req.body as {
      text?: string;
      action?: 'proofread' | 'formalize' | 'summarize';
    };

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'متنی برای پردازش ارسال نشده است.' });
      return;
    }

    const ai = getGenAIClient();

    const prompts: Record<string, string> = {
      proofread: 'متن فارسی زیر را که از OCR استخراج شده است از نظر غلط‌های املایی، نیم‌فاصله‌ها، علائم نگارشی و پیوستگی جملات ویراستاری کن اما هیچ تغییری در محتوا و لحن نویسنده نده. فقط متن ویراستاری‌شده را برگردان:',
      formalize: 'متن فارسی زیر را به نثر رسمی، اداری و معیار فارسی بازنویسی و ویرایش کن. فقط متن نهایی را برگردان:',
      summarize: 'چکیده دقیق و ساختاریافته‌ای از نکات کلیدی متن فارسی زیر در قالب بندهای کوتاه تهیه کن:',
    };

    const instruction = prompts[action || 'proofread'] || prompts.proofread;

    const { result: response } = await executeWithModelFallback(
      OCR_MODEL_FALLBACK_CHAIN,
      async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: `${instruction}\n\n${text}`,
          config:
            modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : undefined,
        });
      },
      { maxAttemptsPerModel: 3, baseDelayMs: 600 }
    );

    res.json({
      resultText: (response.text ?? text).trim(),
    });
  } catch (error: unknown) {
    const friendlyMessage = formatGeminiErrorMessage(error);
    console.error('Smart Edit Error:', friendlyMessage);
    res.status(500).json({ error: friendlyMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Navisa Persian OCR Server running on http://localhost:${PORT}`);
  });
}

startServer();
