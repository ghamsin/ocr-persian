import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ZWNJ,
  unifyPersianCharacters,
  toPersianDigits,
  toEnglishDigits,
  stripPersianDiacritics,
  fixPersianZwnj,
  fixPersianPunctuation,
  applyFullPersianVirastar,
  analyzePersianText,
} from './persianOrthography';

test('unifyPersianCharacters converts Arabic Yeh and Kaf to standard Persian', () => {
  const raw = 'كتاب‌هاي تاريخي ايران';
  const res = unifyPersianCharacters(raw);
  assert.equal(res.text, 'کتاب‌های تاریخی ایران');
  assert.equal(res.count, 5);
});

test('toPersianDigits and toEnglishDigits convert numerals accurately', () => {
  const sample = 'سال 1403 و شماره ٤٥٦';
  const fa = toPersianDigits(sample);
  assert.equal(fa.text, 'سال ۱۴۰۳ و شماره ۴۵۶');
  assert.equal(fa.count, 7);

  const en = toEnglishDigits(fa.text);
  assert.equal(en.text, 'سال 1403 و شماره 456');
  assert.equal(en.count, 7);
});

test('fixPersianZwnj inserts half-spaces for verbal prefixes, plurals, comparatives, and enclitics', () => {
  const raw = 'ما می رویم و کتاب ها را در خانه ام بزرگ تر می بینیم و نمی دانند';
  const fixed = fixPersianZwnj(raw);
  assert.equal(
    fixed.text,
    `ما می${ZWNJ}رویم و کتاب${ZWNJ}ها را در خانه${ZWNJ}ام بزرگ${ZWNJ}تر می${ZWNJ}بینیم و نمی${ZWNJ}دانند`
  );
  assert.ok(fixed.count >= 6);
});

test('fixPersianZwnj separates merged verbal prefixes like میشود and نمیداند', () => {
  const raw = 'این کار میشود و او نمیداند';
  const fixed = fixPersianZwnj(raw);
  assert.equal(fixed.text, `این کار می${ZWNJ}شود و او نمی${ZWNJ}داند`);
  assert.equal(fixed.count, 2);
});

test('fixPersianPunctuation converts straight quotes to Persian guillemets and fixes comma spacing', () => {
  const raw = 'او گفت " شاهنامه " اثر فردوسی است ،و بسیار ارزشمند است .';
  const fixed = fixPersianPunctuation(raw);
  assert.equal(fixed.text, 'او گفت «شاهنامه» اثر فردوسی است، و بسیار ارزشمند است.');
  assert.ok(fixed.count >= 3);
});

test('stripPersianDiacritics removes harakat and tashdid cleanly', () => {
  const poem = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
  const stripped = stripPersianDiacritics(poem);
  assert.equal(stripped.text, 'بسم الله الرحمن الرحیم'.replace(/ی/g, 'ي'));
  assert.ok(stripped.count > 5);
});

test('applyFullPersianVirastar combines all Persian orthography fixes and reports counts', () => {
  const ocrRaw = 'در سال 1399 كتاب ها به چاپ می رسند ،و پژوهشگران "متون كهن" را بررسی میكنند .';
  const report = applyFullPersianVirastar(ocrRaw);
  assert.equal(
    report.text,
    `در سال ۱۳۹۹ کتاب${ZWNJ}ها به چاپ می${ZWNJ}رسند، و پژوهشگران «متون کهن» را بررسی می${ZWNJ}کنند.`
  );
  assert.ok(report.fixesCount >= 10);
  assert.equal(report.breakdown.charsFixed, 3);
  assert.equal(report.breakdown.digitsConverted, 4);
  assert.equal(report.breakdown.zwnjAdded, 3);
});

test('analyzePersianText computes word count, ZWNJ count, and warnings accurately', () => {
  const raw = 'كتاب ها می روند';
  const stats = analyzePersianText(raw);
  assert.equal(stats.wordCount, 4);
  assert.equal(stats.arabicCharWarnings, 1);
  assert.equal(stats.missingZwnjSuggestions, 2);
});

test('fixPersianZwnj joins compound words like بی‌نظیری, نشان‌دهنده, بهینه‌سازی, and نیم‌فاصله‌ها', () => {
  const raw = 'نقش بی نظیری که نشان دهنده بهینه سازی نیم فاصله ها است';
  const fixed = fixPersianZwnj(raw);
  assert.equal(
    fixed.text,
    `نقش بی${ZWNJ}نظیری که نشان${ZWNJ}دهنده بهینه${ZWNJ}سازی نیم${ZWNJ}فاصله${ZWNJ}ها است`
  );
  assert.ok(fixed.count >= 4);
});

