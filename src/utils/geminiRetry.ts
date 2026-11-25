/**
 * Resilient retry, exponential backoff, model fallback, and Persian error formatter
 * for handling Gemini API 503 (UNAVAILABLE / high demand) and transient network spikes.
 */

export const OCR_MODEL_FALLBACK_CHAIN = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
] as const;

export interface RetryFallbackOptions {
  maxAttemptsPerModel?: number;
  baseDelayMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Extracts raw message string from any error object or JSON-serialized SDK error.
 */
export function extractRawErrorString(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Determines whether an error from Gemini API is transient (e.g. 503 UNAVAILABLE, high demand,
 * overloaded, 500, 502, 504, or temporary rate limit) and safe to retry or fall back to another model.
 */
export function isTransientGeminiError(error: unknown): boolean {
  const raw = extractRawErrorString(error).toLowerCase();
  if (!raw) return false;

  const transientPatterns = [
    '503',
    'unavailable',
    'high demand',
    'overloaded',
    'try again later',
    'resource_exhausted',
    '429',
    '500',
    '502',
    '504',
    'internal',
    'deadline_exceeded',
    'econnreset',
    'etimedout',
    'fetch failed',
  ];

  return transientPatterns.some((pattern) => raw.includes(pattern));
}

/**
 * Converts raw SDK / JSON errors (such as `{"error":{"code":503,"message":"This model is currently experiencing high demand..."}}`)
 * into a clean, user-friendly Persian message.
 */
export function formatGeminiErrorMessage(error: unknown): string {
  const raw = extractRawErrorString(error);
  const lower = raw.toLowerCase();

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand') || lower.includes('overloaded')) {
    return 'سرورهای هوش مصنوعی در حال حاضر با ترافیک بالا مواجه هستند. سیستم چندین بار با مدل‌های جایگزین تلاش کرد؛ لطفاً چند ثانیه صبر کرده و دوباره دکمه استخراج را بزنید.';
  }

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return 'سقف مجاز درخواست‌های لحظه‌ای (Quota) تکمیل شده است. لطفاً چند ثانیه صبر کنید یا کلید API خود را در بخش Settings > Secrets بررسی نمایید.';
  }

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return 'کلید API جمینای معتبر نیست یا دسترسی ندارد. لطفاً از بخش Settings > Secrets کلید GEMINI_API_KEY را بررسی کنید.';
  }

  // If the error message is a raw JSON payload, extract its inner message cleanly
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const innerMsg = parsed?.error?.message || parsed?.message;
      if (typeof innerMsg === 'string' && innerMsg.trim()) {
        return `خطای سرویس هوش مصنوعی: ${innerMsg}`;
      }
    } catch {
      // fall through
    }
  }

  return raw || 'خطا در ارتباط با سرویس هوش مصنوعی جمینای';
}

/**
 * Executes an async Gemini API operation across a prioritized list of models,
 * retrying transient errors (like 503 UNAVAILABLE) with exponential backoff
 * and automatically falling back to the next model in the chain.
 */
export async function executeWithModelFallback<T>(
  models: readonly string[],
  operation: (model: string, attempt: number) => Promise<T>,
  options: RetryFallbackOptions = {}
): Promise<{ result: T; usedModel: string; totalAttempts: number }> {
  const maxAttemptsPerModel = options.maxAttemptsPerModel ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 600;
  const sleep = options.sleepFn ?? defaultSleep;

  let lastError: unknown = new Error('هیچ مدلی برای پردازش تعریف نشده است.');
  let totalAttempts = 0;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];

    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      totalAttempts++;
      try {
        const result = await operation(model, totalAttempts);
        return { result, usedModel: model, totalAttempts };
      } catch (err: unknown) {
        lastError = err;

        // If the error is NOT transient (e.g., invalid API key 403 or bad request 400),
        // unless it's a model-specific 404/503, fail immediately if it's auth-related
        const rawLower = extractRawErrorString(err).toLowerCase();
        const isAuthError =
          rawLower.includes('api_key_invalid') ||
          rawLower.includes('permission_denied') ||
          rawLower.includes('کلید api');

        if (isAuthError) {
          throw err;
        }

        const isLastModel = modelIndex === models.length - 1;
        const isLastAttemptForModel = attempt === maxAttemptsPerModel;

        if (isTransientGeminiError(err) && !(isLastModel && isLastAttemptForModel)) {
          // Exponential backoff before next attempt or model switch
          const backoffMs = baseDelayMs * Math.pow(1.6, attempt - 1);
          await sleep(Math.round(backoffMs));
          continue;
        }

        // If non-transient error on first model, still allow trying fallback model once
        if (!isLastModel) {
          break;
        }
      }
    }
  }

  throw lastError;
}
