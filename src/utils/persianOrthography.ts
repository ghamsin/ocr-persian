/**
 * Pure Persian Orthography, ZWNJ (نیم‌فاصله), Digit, and Typography Engine
 * Specifically designed for post-processing and refining Persian OCR output.
 */

export const ZWNJ = '\u200C';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export interface VirastarReport {
  text: string;
  fixesCount: number;
  breakdown: {
    charsFixed: number;
    zwnjAdded: number;
    digitsConverted: number;
    punctuationFixed: number;
  };
}

export interface PersianTextStats {
  wordCount: number;
  charCount: number;
  lineCount: number;
  zwnjCount: number;
  arabicCharWarnings: number;
  missingZwnjSuggestions: number;
  estimatedReadingTimeSec: number;
}

/**
 * 1. Converts Arabic Yeh (ي, ى), Arabic Kaf (ك), and non-standard glyphs to standard Iranian Persian Unicode.
 */
export function unifyPersianCharacters(input: string): { text: string; count: number } {
  let count = 0;
  const replacements: Array<[RegExp, string]> = [
    [/\u064A/g, '\u06CC'], // Arabic Yeh ي -> Persian Yeh ی
    [/\u0649/g, '\u06CC'], // Alef Maksura ى -> Persian Yeh ی
    [/\u0643/g, '\u06A9'], // Arabic Kaf ك -> Persian Kaf ک
    [/\u06C0/g, '\u0647\u0654'], // Heh with Yeh above
    [/\u00A0/g, ' '], // Non-breaking space to standard space
  ];

  let result = input;
  for (const [regex, replacement] of replacements) {
    const matches = result.match(regex);
    if (matches) {
      count += matches.length;
      result = result.replace(regex, replacement);
    }
  }
  return { text: result, count };
}

/**
 * 2. Converts English (0-9) and Arabic-Indic (٠-٩) digits to standard Persian digits (۰-۹),
 * while preserving digits embedded inside English/Latin tokens (e.g. UTF-8, v2.4, ISO-9001, URLs).
 */
export function toPersianDigits(input: string): { text: string; count: number } {
  let count = 0;

  // Tokenize so Latin/URL segments keep their Latin digits intact while standalone/Persian digits convert
  const result = input.replace(
    /https?:\/\/[^\s]+|[A-Za-z][A-Za-z0-9._/-]*|[0-9]+|[٠-٩]+/g,
    (token) => {
      // Preserve URLs and English/Latin technical tokens (e.g., UTF-8, ISO-9001, v2.4, GPT-4)
      if (/^(?:https?:\/\/|[A-Za-z])/.test(token)) {
        return token;
      }
      return token
        .replace(/[0-9]/g, (digit) => {
          count++;
          return PERSIAN_DIGITS[Number(digit)];
        })
        .replace(/[٠-٩]/g, (digit) => {
          const index = ARABIC_DIGITS.indexOf(digit);
          if (index !== -1) {
            count++;
            return PERSIAN_DIGITS[index];
          }
          return digit;
        });
    }
  );

  return { text: result, count };
}

/**
 * 3. Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to English digits (0-9).
 */
export function toEnglishDigits(input: string): { text: string; count: number } {
  let count = 0;
  let result = input.replace(/[۰-۹]/g, (digit) => {
    const index = PERSIAN_DIGITS.indexOf(digit);
    if (index !== -1) {
      count++;
      return String(index);
    }
    return digit;
  });

  result = result.replace(/[٠-٩]/g, (digit) => {
    const index = ARABIC_DIGITS.indexOf(digit);
    if (index !== -1) {
      count++;
      return String(index);
    }
    return digit;
  });

  return { text: result, count };
}

/**
 * 4. Strips Arabic/Persian harakat & diacritics (Fatha, Kasra, Damma, Tanwin, Shadda, Sukun).
 */
export function stripPersianDiacritics(input: string): { text: string; count: number } {
  const diacriticRegex = /[\u064B-\u065F\u0670]/g;
  const matches = input.match(diacriticRegex);
  const count = matches ? matches.length : 0;
  return {
    text: input.replace(diacriticRegex, ''),
    count,
  };
}

/**
 * 5. Fixes Persian ZWNJ (نیم‌فاصله) across verbal prefixes (می/نمی), plural suffixes (ها/های),
 * comparative suffixes (تر/ترین), enclitic pronouns after silent Heh (ه‌ام/ه‌اید/ه‌اند/ه‌ای), and compound prefixes.
 */
export function fixPersianZwnj(input: string): { text: string; count: number } {
  let count = 0;
  let result = input;

  const applyRule = (regex: RegExp, replacer: string | ((substring: string, ...args: string[]) => string)) => {
    result = result.replace(regex, (...args) => {
      count++;
      if (typeof replacer === 'function') {
        return replacer(args[0], ...args.slice(1));
      }
      return replacer;
    });
  };

  // Rule A: Verbal prefixes "می" and "نمی" followed by space and Persian verb stem
  // Avoid matching when followed by standalone nouns if rare, but in Persian "می " or "نمی " before a word is 99% verbal prefix
  applyRule(/(^|[\s«(،؛.])(ن?می)\s+([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{2,})/g, (_m, pre, prefix, stem) => {
    return `${pre}${prefix}${ZWNJ}${stem}`;
  });

  // Rule B: Attached "می" or "نمی" before common verb stems that OCR often merges without ZWNJ
  const commonVerbStems =
    'شود|شوند|شوم|شوی|شویم|شوید|شد|شدند|شدم|شدی|شدیم|شدید|کند|کنند|کنم|کنی|کنیم|کنید|کرد|کردند|کردم|کردی|کردیم|کردید|توان|تواند|توانند|توانم|توانی|توانیم|توانید|توانست|باشد|باشند|باشم|باشی|باشیم|باشید|گوید|گویند|گویم|گویی|گوییم|گویید|گفت|آید|آیند|آیم|آیی|آییم|آیید|آمد|رود|روند|روم|روی|رویم|روید|رفت|دهد|دهند|دهم|دهی|دهیم|دهید|داد|گیرد|گیرند|گیرم|گیری|گیریم|گیرید|گرفت|دارد|دارند|دارم|داری|داریم|دارید|داشت|داند|دانند|دانم|دانی|دانیم|دانید|دانست|خواهد|خواهند|خواهم|خواهی|خواهیم|خواهید|خواست|رسد|رسند|رسید|ماند|مانند|ماندند|زند|زنند|زد|بیند|بینند|دید|گذرد|گذشت|نویسد|نوشت|خواند|خوانند';
  const mergedMiRegex = new RegExp(`(^|[\\s«(،؛.])(ن?می)(${commonVerbStems})(?=$|[\\s»).،؛؟!])`, 'g');
  applyRule(mergedMiRegex, (_m, pre, prefix, stem) => `${pre}${prefix}${ZWNJ}${stem}`);

  // Rule C: Plural suffixes "ها", "های", "هایی", "هایم", "هایت", "هایش", "هایمان", "هایتان", "هایشان"
  applyRule(
    /([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{2,})\s+(ها(?:ی(?:ی|م|ت|ش|مان|تان|شان)?)?)(?=$|[\s»).،؛؟!:])/g,
    (_m, word, suffix) => {
      // Do not join standalone prepositions/pronouns like "آن ها" -> "آن‌ها" is actually standard with ZWNJ too!
      // Only skip if word is "با" or "تا" or "از" or "در" or "بر"
      if (['با', 'تا', 'از', 'در', 'بر', 'که', 'چه'].includes(word)) {
        count--; // revert increment
        return `${word} ${suffix}`;
      }
      return `${word}${ZWNJ}${suffix}`;
    }
  );

  // Rule D: Comparative and superlative suffixes "تر" and "ترین"
  applyRule(
    /([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{2,})\s+(تر(?:ین)?)(?=$|[\s»).،؛؟!:])/g,
    (_m, word, suffix) => {
      if (['با', 'تا', 'از', 'در', 'بر', 'که'].includes(word)) {
        count--;
        return `${word} ${suffix}`;
      }
      return `${word}${ZWNJ}${suffix}`;
    }
  );

  // Rule E: Suffixes after silent Heh (ه + ام / ات / اش / ای / ایم / اید / اند)
  applyRule(
    /([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+ه)\s+(ام|ات|اش|ای|ایم|اید|اند)(?=$|[\s»).،؛؟!:])/g,
    (_m, word, suffix) => {
      if (['نه', 'که', 'چه', 'به'].includes(word)) {
        count--;
        return `${word} ${suffix}`;
      }
      return `${word}${ZWNJ}${suffix}`;
    }
  );

  // Rule F: Prefix "بی" before common nouns/adjectives (including optional suffixes like ی)
  applyRule(
    /(^|[\s«(،؛.])(بی)\s+(نظم|نهایت|تردید|سابقه|نظیر|وقفه|همتا|فایده|نتیجه|توجه|تفاوت|دقت|شمار|کران|پایان|مانند|نقص|عیب|طرف)(ی|ها|ان)?(?=$|[\s»).،؛؟!:])/g,
    (_m, pre, bi, word, suf = '') => `${pre}${bi}${ZWNJ}${word}${suf}`
  );

  // Rule G: Common Persian compound words frequently split by OCR
  applyRule(
    /(نشان|ارائه|تشکیل|تعیین|تولید|مصرف|تنظیم|هدایت|تسهیل)\s+(دهنده|دهندگان)(?=$|[\s\u200C»).،؛؟!:])/g,
    (_m, p1, p2) => `${p1}${ZWNJ}${p2}`
  );
  applyRule(
    /(بهینه|استاندارد|بومی|مقاوم|هوشمند|ساده|آماده|ذخیره|پیاده)\s+(سازی|شده)(?=$|[\s\u200C»).،؛؟!:])/g,
    (_m, p1, p2) => `${p1}${ZWNJ}${p2}`
  );
  applyRule(
    /(نیم|درون|برون|فوق|پیش|پست|زیر|فرا)\s+(فاصله|مرزی|برنامه|العاده|فرض|زمینی|ساخت)(?=$|[\s\u200C»).،؛؟!:])/g,
    (_m, p1, p2) => `${p1}${ZWNJ}${p2}`
  );

  // Collapse multiple consecutive ZWNJs into one
  result = result.replace(/\u200C{2,}/g, ZWNJ);

  return { text: result, count };
}

/**
 * 6. Normalizes Persian punctuation (guillemets «», spacing around ، ؛ ؟ . : and line spacing).
 */
export function fixPersianPunctuation(input: string): { text: string; count: number } {
  let count = 0;
  let result = input;

  // Convert straight double quotes wrapping Persian text into «...»
  result = result.replace(/"([^"\n]+)"/g, (_m, inner) => {
    count++;
    return `«${inner.trim()}»`;
  });

  // Remove space before Persian punctuation marks (، ؛ ؟ ! . :)
  result = result.replace(/[ \t]+([،؛؟!.])/g, (_m, punct) => {
    count++;
    return punct;
  });

  // Ensure a single space after ، ؛ ؟ if followed immediately by a Persian letter
  result = result.replace(/([،؛؟])(?=[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])/g, (_m, punct) => {
    count++;
    return `${punct} `;
  });

  // Remove space inside « and »
  result = result.replace(/«[ \t]+/g, () => {
    count++;
    return '«';
  });
  result = result.replace(/[ \t]+»/g, () => {
    count++;
    return '»';
  });

  // Collapse multiple horizontal spaces on the same line
  result = result.replace(/[ \t]{2,}/g, () => {
    count++;
    return ' ';
  });

  return { text: result, count };
}

/**
 * 7. Runs the complete Persian Virastar pipeline and returns a detailed breakdown report.
 */
export function applyFullPersianVirastar(input: string): VirastarReport {
  const step1 = unifyPersianCharacters(input);
  const step2 = toPersianDigits(step1.text);
  const step3 = fixPersianZwnj(step2.text);
  const step4 = fixPersianPunctuation(step3.text);

  const fixesCount = step1.count + step2.count + step3.count + step4.count;

  return {
    text: step4.text,
    fixesCount,
    breakdown: {
      charsFixed: step1.count,
      digitsConverted: step2.count,
      zwnjAdded: step3.count,
      punctuationFixed: step4.count,
    },
  };
}

/**
 * 8. Analyzes Persian text for live typographic and orthographic metrics.
 */
export function analyzePersianText(input: string): PersianTextStats {
  const trimmed = input.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = input.length;
  const lineCount = trimmed ? input.split(/\r?\n/).length : 0;
  const zwnjMatches = input.match(/\u200C/g);
  const zwnjCount = zwnjMatches ? zwnjMatches.length : 0;

  // Count remaining Arabic Yeh/Kaf characters
  const arabicMatches = input.match(/[\u064A\u0649\u0643]/g);
  const arabicCharWarnings = arabicMatches ? arabicMatches.length : 0;

  // Check how many ZWNJs would be added if fixPersianZwnj ran right now
  const potentialZwnj = fixPersianZwnj(input).count;

  const estimatedReadingTimeSec = Math.max(1, Math.ceil((wordCount / 180) * 60));

  return {
    wordCount,
    charCount,
    lineCount,
    zwnjCount,
    arabicCharWarnings,
    missingZwnjSuggestions: potentialZwnj,
    estimatedReadingTimeSec,
  };
}
