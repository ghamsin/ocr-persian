import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTransientGeminiError,
  formatGeminiErrorMessage,
  executeWithModelFallback,
  OCR_MODEL_FALLBACK_CHAIN,
} from './geminiRetry';

test('isTransientGeminiError detects 503 high demand JSON errors', () => {
  const err503 = new Error(
    '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}'
  );
  assert.equal(isTransientGeminiError(err503), true);
  assert.equal(isTransientGeminiError(new Error('Invalid argument: mimeType missing')), false);
});

test('formatGeminiErrorMessage converts raw 503 JSON error into clear Persian message', () => {
  const err503 = new Error(
    '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}'
  );
  const formatted = formatGeminiErrorMessage(err503);
  assert.ok(formatted.includes('ترافیک بالا'));
  assert.ok(!formatted.includes('"code":503'));
});

test('executeWithModelFallback retries on 503 and switches to fallback model when primary is overloaded', async () => {
  const calledModels: string[] = [];

  const { result, usedModel, totalAttempts } = await executeWithModelFallback(
    OCR_MODEL_FALLBACK_CHAIN,
    async (model) => {
      calledModels.push(model);
      if (model === 'gemini-4-hydrogen') {
        throw new Error(
          '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'
        );
      }
      return 'متن استخراج شده با مدل جایگزین';
    },
    {
      maxAttemptsPerModel: 2,
      baseDelayMs: 1,
      sleepFn: async () => {},
    }
  );

  assert.equal(result, 'متن استخراج شده با مدل جایگزین');
  assert.equal(usedModel, 'gemini-3.1-flash-lite');
  assert.equal(totalAttempts, 3);
  assert.deepEqual(calledModels, [
    'gemini-4-hydrogen',
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
  ]);
});

test('executeWithModelFallback succeeds on second attempt of primary model if spike clears', async () => {
  let count = 0;
  const { result, usedModel, totalAttempts } = await executeWithModelFallback(
    OCR_MODEL_FALLBACK_CHAIN,
    async (model) => {
      count++;
      if (count === 1) {
        throw new Error('503 UNAVAILABLE');
      }
      return 'موفق در تلاش دوم';
    },
    {
      maxAttemptsPerModel: 2,
      baseDelayMs: 1,
      sleepFn: async () => {},
    }
  );

  assert.equal(result, 'موفق در تلاش دوم');
  assert.equal(usedModel, 'gemini-4-hydrogen');
  assert.equal(totalAttempts, 2);
});

test('safeParseJsonResponse gracefully handles HTML 404 pages returned by GitHub Pages static hosting', async () => {
  const { safeParseJsonResponse } = await import('./clientSideOcr');

  const html404Response = new Response('<!DOCTYPE html><html><body>404 Not Found</body></html>', {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const htmlParsed = await safeParseJsonResponse(html404Response);
  assert.equal(htmlParsed.isJson, false);
  assert.equal(htmlParsed.data, null);

  const jsonResponse = new Response(JSON.stringify({ extractedText: 'سلام دنیا' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const jsonParsed = await safeParseJsonResponse<{ extractedText: string }>(jsonResponse);
  assert.equal(jsonParsed.isJson, true);
  assert.equal(jsonParsed.data?.extractedText, 'سلام دنیا');
});

