/**
 * نویسا (Navisa) — موتور بازشناسی نویسه نوری (OCR) و ویراستاری تخصصی زبان فارسی
 * طراحی شده با معماری سازگار با GitHub Pages (اجرای مستقیم از ریشه مخزن) و سرور هوش مصنوعی
 */

const ZWNJ = '\u200C';
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const MODE_LABELS = {
  standard: 'متن چاپی و کتاب',
  structured: 'فاکتور و جدول (Markdown)',
  handwriting: 'دست‌خط و یادداشت',
  poetry: 'شعر و حفظ اعراب',
};

const PERSIAN_SAMPLE_DOCUMENTS = [
  {
    id: 'book-article',
    title: 'صفحه کتاب: تاریخچه خط و چاپ در ایران',
    categoryLabel: 'کتاب و مقاله چاپی',
    mode: 'standard',
    confidence: 98.4,
    paperStyle: 'book',
    canvasLines: [
      'فصل سوم: تحول صنعت چاپ و نشر در ایران',
      'در سال 1233 هجری قمری، نخستین چاپخانه سربی در تبریز آغاز به کار کرد.',
      'پژوهشگران معتقدند که کتاب ها و رساله های علمی این دوره نقش',
      'بی نظیری در گسترش آگاهی عمومی ایفا می کنند. در کتابخانه های',
      'ملی ایران بیش از 4500 نسخه خطی و چاپی کهن نگهداری می شود',
      'که نشان دهنده دقت بالای استادان خوشنویس و حروفچین است.',
    ],
    rawOcrText: `فصل سوم: تحول صنعت چاپ و نشر در ایران

در سال 1233 هجری قمری ، نخستین چاپخانه سربی در تبریز آغاز به كار كرد . پژوهشگران معتقدند كه كتاب ها و رساله هاي علمی این دوره نقش بی نظیری در گسترش آگاهی عمومی ایفا می كنند .

در كتابخانه هاي ملی ایران بیش از 4500 نسخه خطی و چاپی كهن نگهداری میشود كه نشان دهنده دقت بالای استادان خوشنویس است . بسیاری از نویسندگان در مقدمه آثار خود گفته اند : "حفظ و بازآفرینی متون پارسی ، میراث ماندگار فرهنگ ماست" .`,
    notes: 'تشخیص ستون متنی کتاب با وضوح بالا — آماده اجرای ویراستار نیم‌فاصله و حروف استاندارد فارسی',
  },
  {
    id: 'handwriting-note',
    title: 'دست‌خط: صورت‌جلسه برنامه‌ریزی محصول',
    categoryLabel: 'دست‌خط و یادداشت',
    mode: 'handwriting',
    confidence: 94.2,
    paperStyle: 'lined',
    canvasLines: [
      'یادداشت جلسه فنی - چهارشنبه ۱۴ آبان ۱۴۰۴',
      '۱. بهینه‌سازی سرعت پردازش تصاویر اسکن‌شده تا ۴۰ درصد',
      '۲. افزودن قابلیت تشخیص خودکار نیم‌فاصله و اعداد فارسی',
      '۳. پشتیبانی از خروجی مستقیم فایل ورد (DOC) و مارک‌داون',
      '۴. تحویل نسخه آزمایشی به تیم کنترل کیفیت تا پایان هفته',
    ],
    rawOcrText: `یادداشت جلسه فنی - چهارشنبه 14 آبان 1404

۱. بهینه سازی سرعت پردازش تصاویر اسکن شده تا 40 درصد
۲. افزودن قابلیت تشخیص خودکار نیم فاصله ها و اعداد فارسی
۳. پشتیبانی از خروجی مستقیم فایل ورد (DOC) و مارک داون
۴. تحویل نسخه آزمایشی به تیم کنترل کیفیت تا پایان هفته آینده

یادآوری مهم: تمام فرم ها و گزارش های مالی باید پیش از ارسال نهایی بازبینی شوند .`,
    notes: 'دست‌خط تحریری فارسی با موفقیت رمزگشایی و به متن قابل ویرایش تبدیل شد',
  },
  {
    id: 'invoice-table',
    title: 'فاکتور رسمی: صورت‌حساب خدمات نرم‌افزاری',
    categoryLabel: 'فاکتور و جدول اداری',
    mode: 'structured',
    confidence: 97.8,
    paperStyle: 'invoice',
    canvasLines: [
      'صورت‌حساب فروش کالا و خدمات — شماره: ۱۴۰۴/۸۹۲',
      'خریدار: شرکت توسعه فناوری داده‌پردازان پارس',
      '--------------------------------------------------',
      'ردیف | شرح خدمات                     | تعداد | مبلغ کل (تومان)',
      '۱    | ماژول استخراج متن فارسی (OCR) | ۱     | ۲۴,۵۰۰,۰۰۰',
      '۲    | بسته پردازش اسناد بایگانی     | ۳     | ۱۸,۹۰۰,۰۰۰',
      '۳    | پشتیبانی و آموزش تخصصی        | ۱     | ۶,۶۰۰,۰۰۰',
      '--------------------------------------------------',
      'جمع کل قابل پرداخت: ۵۰,۰۰۰,۰۰۰ تومان',
    ],
    rawOcrText: `### صورت‌حساب فروش کالا و خدمات
شماره فاکتور: ۱۴۰۴/۸۹۲ · تاریخ صدور: ۱۴۰۴/۰۸/۲۵
خریدار: شرکت توسعه فناوری داده‌پردازان پارس

| ردیف | شرح کالا یا خدمات | تعداد | مبلغ واحد (تومان) | مبلغ کل (تومان) |
| --- | --- | --- | --- | --- |
| ۱ | مجوز سازمانی ماژول استخراج متن فارسی (OCR) | ۱ | ۲۴,۵۰۰,۰۰۰ | ۲۴,۵۰۰,۰۰۰ |
| ۲ | بسته پردازش دسته‌ای اسناد بایگانی (۱۰۰ هزار برگ) | ۳ | ۶,۳۰۰,۰۰۰ | ۱۸,۹۰۰,۰۰۰ |
| ۳ | خدمات استقرار، آموزش و پشتیبانی سالانه | ۱ | ۶,۶۰۰,۰۰۰ | ۶,۶۰۰,۰۰۰ |

جمع کل قابل پرداخت: ۵۰,۰۰۰,۰۰۰ تومان
توضیحات: تمامی مبالغ فوق شامل مالیات بر ارزش افزوده می‌باشد.`,
    notes: 'ساختار جدول ۴ ستونه و ارقام مالی در قالب Markdown استاندارد استخراج گردید',
  },
  {
    id: 'classical-poetry',
    title: 'شعر و متون کهن: غزل حافظ با اعراب کامل',
    categoryLabel: 'شعر و متون معرب',
    mode: 'poetry',
    confidence: 96.5,
    paperStyle: 'manuscript',
    canvasLines: [
      'غزلیات حافظ شیرازی — نسخه تصحیح قزوینی',
      'دوش دیدَم که مَلائِک دَرِ مِیخانه زَدَند',
      'گِلِ آدَم بِسِرِشتَند و به پِیمانه زَدَند',
      'ساکِنانِ حَرَمِ سِتْر و عَفافِ مَلَکوت',
      'با مَنِ راه نِشین بادهٔ مَستانه زَدَند',
    ],
    rawOcrText: `غزلیات حافظ شیرازی — نسخه تصحیح قزوینی و غنی

دوش دیدَم که مَلائِک دَرِ مِیخانه زَدَند
گِلِ آدَم بِسِرِشتَند و به پِیمانه زَدَند

ساکِنانِ حَرَمِ سِتْر و عَفافِ مَلَکوت
با مَنِ راه‌نِشین بادهٔ مَستانه زَدَند

آسمان بارِ اَمانَت نَتَوانِست کَشید
قُرعهٔ کار به نامِ مَنِ دیوانه زَدَند`,
    notes: 'ابیات شعر با تفکیک مصرع‌ها و حفظ کامل حرکات و اعراب استخراج شد',
  },
];

// Application State
const appState = {
  activeDocId: 'book-article',
  documentTitle: PERSIAN_SAMPLE_DOCUMENTS[0].title,
  categoryLabel: PERSIAN_SAMPLE_DOCUMENTS[0].categoryLabel,
  mode: PERSIAN_SAMPLE_DOCUMENTS[0].mode,
  imageUrl: '',
  mimeType: 'image/png',
  confidence: PERSIAN_SAMPLE_DOCUMENTS[0].confidence,
  notes: PERSIAN_SAMPLE_DOCUMENTS[0].notes,
  zoom: 100,
  rotation: 0,
  highContrast: false,
  viewMode: 'split', // 'split' | 'editor' | 'image'
  showZwnjInspector: false,
  undoStack: [],
  archiveList: [],
  cameraStream: null,
};

// ============================================================================
// 1. Persian Orthography & Virastar Pure Functions
// ============================================================================

function unifyPersianCharacters(input) {
  let count = 0;
  const replacements = [
    [/\u064A/g, '\u06CC'], // ي -> ی
    [/\u0649/g, '\u06CC'], // ى -> ی
    [/\u0643/g, '\u06A9'], // ك -> ک
    [/\u06C0/g, '\u0647\u0654'],
    [/\u00A0/g, ' '],
  ];
  let result = input;
  for (const [regex, rep] of replacements) {
    const matches = result.match(regex);
    if (matches) {
      count += matches.length;
      result = result.replace(regex, rep);
    }
  }
  return { text: result, count };
}

function toPersianDigits(input) {
  let count = 0;
  let result = input.replace(/[0-9]/g, (d) => {
    count++;
    return PERSIAN_DIGITS[Number(d)];
  });
  result = result.replace(/[٠-٩]/g, (d) => {
    const idx = ARABIC_DIGITS.indexOf(d);
    if (idx !== -1) {
      count++;
      return PERSIAN_DIGITS[idx];
    }
    return d;
  });
  return { text: result, count };
}

function toEnglishDigits(input) {
  let count = 0;
  let result = input.replace(/[۰-۹]/g, (d) => {
    const idx = PERSIAN_DIGITS.indexOf(d);
    if (idx !== -1) {
      count++;
      return String(idx);
    }
    return d;
  });
  result = result.replace(/[٠-٩]/g, (d) => {
    const idx = ARABIC_DIGITS.indexOf(d);
    if (idx !== -1) {
      count++;
      return String(idx);
    }
    return d;
  });
  return { text: result, count };
}

function stripPersianDiacritics(input) {
  const regex = /[\u064B-\u065F\u0670]/g;
  const matches = input.match(regex);
  const count = matches ? matches.length : 0;
  return { text: input.replace(regex, ''), count };
}

function fixPersianZwnj(input) {
  let count = 0;
  let result = input;

  const applyRule = (regex, replacer) => {
    result = result.replace(regex, (...args) => {
      count++;
      return replacer(...args);
    });
  };

  // A: Verbal prefixes می / نمی followed by space
  applyRule(/(^|[\s«(،؛.])(ن?می)\s+([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{2,})/g, (_m, pre, prefix, stem) => {
    return `${pre}${prefix}${ZWNJ}${stem}`;
  });

  // B: Merged verbal prefixes
  const commonVerbStems =
    'شود|شوند|شوم|شوی|شویم|شوید|شد|شدند|شدم|شدی|شدیم|شدید|کند|کنند|کنم|کنی|کنیم|کنید|کرد|کردند|کردم|کردی|کردیم|کردید|توان|تواند|توانند|توانم|توانی|توانیم|توانید|توانست|باشد|باشند|باشم|باشی|باشیم|باشید|گوید|گویند|گویم|گویی|گوییم|گویید|گفت|آید|آیند|آیم|آیی|آییم|آیید|آمد|رود|روند|روم|روی|رویم|روید|رفت|دهد|دهند|دهم|دهی|دهیم|دهید|داد|گیرد|گیرند|گیرم|گیری|گیریم|گیرید|گرفت|دارد|دارند|دارم|داری|داریم|دارید|داشت|داند|دانند|دانم|دانی|دانیم|دانید|دانست|خواهد|خواهند|خواهم|خواهی|خواهیم|خواهید|خواست|رسد|رسند|رسید|ماند|مانند|ماندند|زند|زنند|زد|بیند|بینند|دید|گذرد|گذشت|نویسد|نوشت|خواند|خوانند';
  const mergedMiRegex = new RegExp(`(^|[\\s«(،؛.])(ن?می)(${commonVerbStems})(?=$|[\\s»).،؛؟!])`, 'g');
  applyRule(mergedMiRegex, (_m, pre, prefix, stem) => `${pre}${prefix}${ZWNJ}${stem}`);

  // C: Plural suffixes ها / های / هایی
  applyRule(
    /([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{2,})\s+(ها(?:ی(?:ی|م|ت|ش|مان|تان|شان)?)?)(?=$|[\s»).،؛؟!:])/g,
    (_m, word, suffix) => {
      if (['با', 'تا', 'از', 'در', 'بر', 'که', 'چه'].includes(word)) {
        count--;
        return `${word} ${suffix}`;
      }
      return `${word}${ZWNJ}${suffix}`;
    }
  );

  // D: Comparative suffixes تر / ترین
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

  // E: Silent Heh + enclitics
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

  // F: Prefix بی
  applyRule(
    /(^|[\s«(،؛.])(بی)\s+(نظم|نهایت|تردید|سابقه|نظیر|وقفه|همتا|فایده|نتیجه|توجه|تفاوت|دقت|شمار|کران|پایان|مانند|نقص|عیب|طرف)(ی|ها|ان)?(?=$|[\s»).،؛؟!:])/g,
    (_m, pre, bi, word, suf = '') => `${pre}${bi}${ZWNJ}${word}${suf}`
  );

  // G: Common compound words
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

  result = result.replace(/\u200C{2,}/g, ZWNJ);
  return { text: result, count };
}

function fixPersianPunctuation(input) {
  let count = 0;
  let result = input;

  result = result.replace(/"([^"\n]+)"/g, (_m, inner) => {
    count++;
    return `«${inner.trim()}»`;
  });

  result = result.replace(/[ \t]+([،؛؟!.])/g, (_m, punct) => {
    count++;
    return punct;
  });

  result = result.replace(/([،؛؟])(?=[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])/g, (_m, punct) => {
    count++;
    return `${punct} `;
  });

  result = result.replace(/«[ \t]+/g, () => {
    count++;
    return '«';
  });
  result = result.replace(/[ \t]+»/g, () => {
    count++;
    return '»';
  });

  result = result.replace(/[ \t]{2,}/g, () => {
    count++;
    return ' ';
  });

  return { text: result, count };
}

function applyFullPersianVirastar(input) {
  const s1 = unifyPersianCharacters(input);
  const s2 = toPersianDigits(s1.text);
  const s3 = fixPersianZwnj(s2.text);
  const s4 = fixPersianPunctuation(s3.text);

  return {
    text: s4.text,
    fixesCount: s1.count + s2.count + s3.count + s4.count,
    breakdown: {
      charsFixed: s1.count,
      digitsConverted: s2.count,
      zwnjAdded: s3.count,
      punctuationFixed: s4.count,
    },
  };
}

function analyzePersianText(input) {
  const trimmed = (input || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = (input || '').length;
  const lineCount = trimmed ? trimmed.split(/\r?\n/).length : 0;
  const zwnjMatches = (input || '').match(/\u200C/g);
  const zwnjCount = zwnjMatches ? zwnjMatches.length : 0;
  const arabicMatches = (input || '').match(/[\u064A\u0649\u0643]/g);
  const arabicCharWarnings = arabicMatches ? arabicMatches.length : 0;
  const missingZwnjSuggestions = fixPersianZwnj(input || '').count;
  const estimatedReadingTimeSec = Math.max(1, Math.ceil((wordCount / 180) * 60));

  const totalIssues = arabicCharWarnings + missingZwnjSuggestions;
  const healthPercent = wordCount === 0 ? 100 : Math.max(60, Math.min(100, Math.round(100 - (totalIssues / Math.max(10, wordCount)) * 45)));

  return {
    wordCount,
    charCount,
    lineCount,
    zwnjCount,
    arabicCharWarnings,
    missingZwnjSuggestions,
    estimatedReadingTimeSec,
    healthPercent,
  };
}

// ============================================================================
// 2. High-DPI Sample Document Canvas Renderer
// ============================================================================

function renderSampleDocumentToDataUrl(doc) {
  const canvas = document.createElement('canvas');
  canvas.width = 920;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (doc.paperStyle === 'book') {
    ctx.fillStyle = '#FCFBF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#D6D1C4';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
    ctx.strokeStyle = '#E8E3D9';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  } else if (doc.paperStyle === 'lined') {
    ctx.fillStyle = '#FEFDF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    for (let y = 105; y < canvas.height - 45; y += 68) {
      ctx.beginPath();
      ctx.moveTo(44, y);
      ctx.lineTo(canvas.width - 44, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 78, 32);
    ctx.lineTo(canvas.width - 78, canvas.height - 32);
    ctx.stroke();
  } else if (doc.paperStyle === 'invoice') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(32, 32, canvas.width - 64, 88);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  } else {
    ctx.fillStyle = '#F9F5EB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#B49B6B';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
    ctx.strokeStyle = '#D5C39C';
    ctx.lineWidth = 1;
    ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);
  }

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  const startX = doc.paperStyle === 'lined' ? canvas.width - 98 : canvas.width - 70;
  let currentY = 92;

  doc.canvasLines.forEach((line, idx) => {
    if (idx === 0) {
      ctx.font = 'bold 26px Vazirmatn, Tahoma, sans-serif';
      ctx.fillStyle = doc.paperStyle === 'manuscript' ? '#78350F' : '#0F172A';
      ctx.fillText(line, startX, currentY);
      currentY += 76;
    } else {
      if (doc.paperStyle === 'lined') {
        ctx.font = '500 22px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#1E3A8A';
      } else if (doc.paperStyle === 'invoice') {
        ctx.font = '500 19px Vazirmatn, monospace, Tahoma';
        ctx.fillStyle = '#1E293B';
      } else if (doc.paperStyle === 'manuscript') {
        ctx.font = '500 24px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#292524';
      } else {
        ctx.font = '400 22px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#1E293B';
      }
      ctx.fillText(line, startX, currentY);
      currentY += doc.paperStyle === 'invoice' ? 52 : 66;
    }
  });

  ctx.font = '400 15px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText(`برگه نمونه استاندارد نویسا · ${doc.categoryLabel}`, 70, canvas.height - 54);

  return canvas.toDataURL('image/png');
}

// ============================================================================
// 3. Theme Mode & Mobile Viewport Preview Toggles (Matching ProductPerSheet)
// ============================================================================

function toggleThemeMode() {
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  const btn = document.getElementById('toggleThemeBtn');
  const isDark = htmlEl.getAttribute('data-theme') === 'dark' || bodyEl.classList.contains('dark-theme');

  if (isDark) {
    htmlEl.removeAttribute('data-theme');
    bodyEl.classList.remove('dark-theme');
    if (btn) {
      btn.textContent = 'حالت تیره';
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('active-dark-mode');
    }
    try { localStorage.setItem('navisa_theme', 'light'); } catch {}
  } else {
    htmlEl.setAttribute('data-theme', 'dark');
    bodyEl.classList.add('dark-theme');
    if (btn) {
      btn.textContent = 'حالت روشن';
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('active-dark-mode');
    }
    try { localStorage.setItem('navisa_theme', 'dark'); } catch {}
  }
}

function toggleMobileDesktopMode() {
  const bodyEl = document.body;
  const btn = document.getElementById('toggleViewportModeBtn');
  const isMobile = bodyEl.classList.contains('mobile-view-mode');

  if (isMobile) {
    bodyEl.classList.remove('mobile-view-mode');
    bodyEl.classList.add('desktop-view-forced');
    if (btn) {
      btn.textContent = 'نمایش نسخه موبایل';
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('active-mobile-mode');
    }
  } else {
    bodyEl.classList.add('mobile-view-mode');
    bodyEl.classList.remove('desktop-view-forced');
    if (btn) {
      btn.textContent = 'نمایش نسخه دسکتاپ';
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('active-mobile-mode');
    }
  }
}

window.toggleThemeMode = toggleThemeMode;
window.toggleMobileDesktopMode = toggleMobileDesktopMode;

// ============================================================================
// 4. UI Rendering & Live Metrics Synchronization
// ============================================================================

function showStatusBanner(message, type = 'info') {
  const banner = document.getElementById('ocrStatusBanner');
  if (!banner) return;
  banner.style.display = 'block';
  banner.textContent = message;
  banner.className = 'pdf-export-status';
  if (type === 'success') {
    banner.classList.add('status-success');
  } else if (type === 'error') {
    banner.classList.add('status-error');
  }
}

function getEditorText() {
  const textarea = document.getElementById('persianOcrTextarea');
  return textarea ? textarea.value : '';
}

function setEditorText(newText, recordUndo = false) {
  const textarea = document.getElementById('persianOcrTextarea');
  if (!textarea) return;
  if (recordUndo && textarea.value !== newText) {
    appState.undoStack.push(textarea.value);
    if (appState.undoStack.length > 20) appState.undoStack.shift();
  }
  textarea.value = newText;
  updateAllMetricsAndViews();
}

function renderZwnjInspector(text) {
  const box = document.getElementById('zwnjInspectorView');
  if (!box) return;
  box.innerHTML = '';
  const segments = (text || '').split(ZWNJ);
  segments.forEach((seg, idx) => {
    const span = document.createElement('span');
    span.textContent = seg;
    box.appendChild(span);
    if (idx < segments.length - 1) {
      const badge = document.createElement('mark');
      badge.className = 'zwnj-badge';
      badge.title = 'نیم‌فاصله استاندارد فارسی (ZWNJ)';
      badge.textContent = 'نیم‌فاصله';
      box.appendChild(badge);
    }
  });
}

function updateImageOpticalStyles() {
  const img = document.getElementById('ocrPreviewImage');
  if (!img) return;
  img.style.transform = `scale(${appState.zoom / 100}) rotate(${appState.rotation}deg)`;
  img.style.filter = appState.highContrast
    ? 'contrast(1.48) grayscale(1) brightness(1.04)'
    : 'none';

  const zoomInput = document.getElementById('zoomInput');
  const zoomSlider = document.getElementById('zoomSlider');
  const rotationInput = document.getElementById('rotationInput');
  const contrastBtn = document.getElementById('toggleContrastBtn');

  if (zoomInput) zoomInput.value = String(appState.zoom);
  if (zoomSlider) zoomSlider.value = String(appState.zoom);
  if (rotationInput) rotationInput.value = String(appState.rotation);
  if (contrastBtn) {
    contrastBtn.classList.toggle('active', appState.highContrast);
  }
}

function renderArchiveMatrixTable() {
  const tbody = document.getElementById('liveOcrMatrixBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  appState.archiveList.forEach((rec) => {
    const tr = document.createElement('tr');
    const isActive = rec.id === appState.activeDocId;
    if (isActive) tr.className = 'matrix-row-active';

    const stats = analyzePersianText(rec.extractedText || '');

    const tdTitle = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = rec.title;
    tdTitle.appendChild(strong);
    if (rec.id === 'book-article') {
      const tag = document.createElement('span');
      tag.className = 'best-choice-label';
      tag.textContent = ' · نمونه پیشنهادی تست ویراستار';
      tdTitle.appendChild(tag);
    }

    const tdMode = document.createElement('td');
    tdMode.textContent = MODE_LABELS[rec.mode] || rec.categoryLabel;

    const tdWords = document.createElement('td');
    tdWords.className = 'mono-num';
    tdWords.textContent = `${stats.wordCount} کلمه`;

    const tdZwnj = document.createElement('td');
    tdZwnj.className = 'mono-num';
    tdZwnj.textContent = `${stats.zwnjCount} مورد`;

    const tdConf = document.createElement('td');
    tdConf.className = 'mono-num low-waste-text';
    tdConf.textContent = `${rec.confidence}%`;

    const tdAction = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = isActive ? 'preset-btn active' : 'preset-btn';
    btn.textContent = isActive ? 'انتخاب شده' : 'انتخاب سند';
    btn.addEventListener('click', () => {
      loadArchiveRecordIntoWorkspace(rec);
    });
    tdAction.appendChild(btn);

    tr.appendChild(tdTitle);
    tr.appendChild(tdMode);
    tr.appendChild(tdWords);
    tr.appendChild(tdZwnj);
    tr.appendChild(tdConf);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

function updateAllMetricsAndViews() {
  const text = getEditorText();
  const stats = analyzePersianText(text);

  // Sync current text into active archive item
  const currentRec = appState.archiveList.find((r) => r.id === appState.activeDocId);
  if (currentRec) {
    currentRec.extractedText = text;
  }

  // 1. Update 4-Column Top KPI Strip
  const kpiWordCount = document.getElementById('kpiWordCount');
  const kpiCharLineMeta = document.getElementById('kpiCharLineMeta');
  const kpiZwnjCount = document.getElementById('kpiZwnjCount');
  const kpiMissingZwnjMeta = document.getElementById('kpiMissingZwnjMeta');
  const kpiUnicodeHealth = document.getElementById('kpiUnicodeHealth');
  const kpiArabicCharsMeta = document.getElementById('kpiArabicCharsMeta');
  const kpiConfidence = document.getElementById('kpiConfidence');
  const kpiActiveModeMeta = document.getElementById('kpiActiveModeMeta');

  if (kpiWordCount) kpiWordCount.textContent = String(stats.wordCount);
  if (kpiCharLineMeta) kpiCharLineMeta.textContent = `${stats.charCount} نویسه · ${stats.lineCount} سطر`;
  if (kpiZwnjCount) kpiZwnjCount.textContent = String(stats.zwnjCount);
  if (kpiMissingZwnjMeta) {
    kpiMissingZwnjMeta.textContent =
      stats.missingZwnjSuggestions > 0
        ? `پیشنهاد اصلاح نیم‌فاصله: ${stats.missingZwnjSuggestions} مورد`
        : 'تمامی نیم‌فاصله‌ها استاندارد هستند';
  }
  if (kpiUnicodeHealth) kpiUnicodeHealth.textContent = `${stats.healthPercent}%`;
  if (kpiArabicCharsMeta) {
    kpiArabicCharsMeta.textContent = `حروف عربی (ي/ك) باقی‌مانده: ${stats.arabicCharWarnings}`;
  }
  if (kpiConfidence) kpiConfidence.textContent = `${appState.confidence}%`;
  if (kpiActiveModeMeta) kpiActiveModeMeta.textContent = `حالت فعال: ${MODE_LABELS[appState.mode] || 'استاندارد'}`;

  // 2. Update Virastar Button Counts
  const fixZwnjBtn = document.getElementById('fixZwnjBtn');
  const unifyCharsBtn = document.getElementById('unifyCharsBtn');
  if (fixZwnjBtn) {
    fixZwnjBtn.textContent = `اصلاح نیم‌فاصله‌ها (${stats.missingZwnjSuggestions})`;
  }
  if (unifyCharsBtn) {
    unifyCharsBtn.textContent = `استانداردسازی ی و ک (${stats.arabicCharWarnings})`;
  }

  // 3. Update Visualizer Subtitle & Inspector
  const visualizerSummaryText = document.getElementById('visualizerSummaryText');
  if (visualizerSummaryText) {
    visualizerSummaryText.textContent = `${appState.documentTitle} · دقت تخمینی: ${appState.confidence}% · ${appState.notes}`;
  }

  if (appState.showZwnjInspector) {
    renderZwnjInspector(text);
  }

  // 4. Update Utilization / Orthographic Health Bar
  const barEfficiency = document.getElementById('orthographyHealthBar');
  const barWaste = document.getElementById('orthographyIssueBar');
  if (barEfficiency && barWaste) {
    barEfficiency.style.width = `${stats.healthPercent}%`;
    barWaste.style.width = `${100 - stats.healthPercent}%`;
  }

  const inspectorBar = document.getElementById('liveTextInspectorBar');
  if (inspectorBar) {
    const totalPending = stats.missingZwnjSuggestions + stats.arabicCharWarnings;
    inspectorBar.textContent =
      totalPending > 0
        ? `وضعیت نگارش: ${totalPending} مورد قابل بهینه‌سازی در متن شناسایی شد (نیم‌فاصله جاافتاده: ${stats.missingZwnjSuggestions} · حروف ي/ك عربی: ${stats.arabicCharWarnings}). با کلیک روی «ویراستار جامع فارسی» همه را یکجا اصلاح کنید.`
        : `وضعیت نگارش: عالی (۱۰۰٪ استاندارد) — تمامی نیم‌فاصله‌ها، حروف «ی/ک» و علائم نگارشی منطبق با استاندارد خط فارسی هستند.`;
  }

  // 5. Update 6-Row Breakdown Table
  const detailWordCharCount = document.getElementById('detailWordCharCount');
  const detailActiveZwnj = document.getElementById('detailActiveZwnj');
  const detailPendingZwnj = document.getElementById('detailPendingZwnj');
  const detailArabicChars = document.getElementById('detailArabicChars');
  const detailReadingTime = document.getElementById('detailReadingTime');
  const detailOverallStatus = document.getElementById('detailOverallStatus');

  if (detailWordCharCount) {
    detailWordCharCount.textContent = `${stats.wordCount} کلمه (${stats.charCount} نویسه در ${stats.lineCount} سطر)`;
  }
  if (detailActiveZwnj) {
    detailActiveZwnj.textContent = `${stats.zwnjCount} نیم‌فاصله فعال`;
  }
  if (detailPendingZwnj) {
    detailPendingZwnj.textContent =
      stats.missingZwnjSuggestions > 0 ? `${stats.missingZwnjSuggestions} مورد نیازمند اصلاح` : '۰ مورد (تکمیل)';
  }
  if (detailArabicChars) {
    detailArabicChars.textContent =
      stats.arabicCharWarnings > 0 ? `${stats.arabicCharWarnings} نویسه عربی (ي/ك)` : '۰ مورد (پاک‌سازی شده)';
  }
  if (detailReadingTime) {
    detailReadingTime.textContent = `حدود ${stats.estimatedReadingTimeSec} ثانیه`;
  }
  if (detailOverallStatus) {
    detailOverallStatus.textContent =
      stats.missingZwnjSuggestions === 0 && stats.arabicCharWarnings === 0
        ? 'آماده انتشار و خروجی استاندارد فارسی'
        : 'پیشنهاد می‌شود دکمه «ویراستار جامع فارسی» را بزنید';
  }

  // 6. Update Archive Matrix Table
  renderArchiveMatrixTable();
}

// ============================================================================
// 5. Sample Selection, File Upload & Archive Switching
// ============================================================================

function syncPresetActiveButtons() {
  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-sample') === appState.activeDocId);
  });
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === appState.mode);
  });
}

function loadSampleById(sampleId) {
  const sample = PERSIAN_SAMPLE_DOCUMENTS.find((s) => s.id === sampleId) || PERSIAN_SAMPLE_DOCUMENTS[0];
  const dataUrl = renderSampleDocumentToDataUrl(sample);

  appState.activeDocId = sample.id;
  appState.documentTitle = sample.title;
  appState.categoryLabel = sample.categoryLabel;
  appState.mode = sample.mode;
  appState.imageUrl = dataUrl;
  appState.mimeType = 'image/png';
  appState.confidence = sample.confidence;
  appState.notes = sample.notes;
  appState.zoom = 100;
  appState.rotation = 0;
  appState.highContrast = false;

  const imgEl = document.getElementById('ocrPreviewImage');
  if (imgEl) {
    imgEl.src = dataUrl;
    imgEl.alt = sample.title;
  }

  syncPresetActiveButtons();
  updateImageOpticalStyles();
  setEditorText(sample.rawOcrText, false);
  showStatusBanner(`نمونه «${sample.title}» بارگذاری شد. می‌توانید ویراستار جامع فارسی را اجرا کنید یا تصویر جدیدی بارگذاری نمایید.`, 'info');
}

function loadArchiveRecordIntoWorkspace(rec) {
  appState.activeDocId = rec.id;
  appState.documentTitle = rec.title;
  appState.categoryLabel = rec.categoryLabel;
  appState.mode = rec.mode;
  appState.confidence = rec.confidence;
  appState.notes = rec.notes;

  const matchingSample = PERSIAN_SAMPLE_DOCUMENTS.find((s) => s.id === rec.id);
  const url = rec.imageUrl || (matchingSample ? renderSampleDocumentToDataUrl(matchingSample) : '');
  appState.imageUrl = url;

  const imgEl = document.getElementById('ocrPreviewImage');
  if (imgEl && url) {
    imgEl.src = url;
    imgEl.alt = rec.title;
  }

  syncPresetActiveButtons();
  setEditorText(rec.extractedText, false);
  showStatusBanner(`سند «${rec.title}» در میز کار بازگشایی شد.`, 'success');
}

function handleUploadedImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
    if (!dataUrl) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const newId = `upload-${Date.now()}`;
    appState.activeDocId = newId;
    appState.documentTitle = `سند بارگذاری‌شده: ${cleanName}`;
    appState.categoryLabel = 'تصویر کاربر';
    appState.imageUrl = dataUrl;
    appState.mimeType = file.type || 'image/png';
    appState.zoom = 100;
    appState.rotation = 0;

    const imgEl = document.getElementById('ocrPreviewImage');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.alt = appState.documentTitle;
    }

    syncPresetActiveButtons();
    updateImageOpticalStyles();
    showStatusBanner(
      `تصویر «${file.name}» بارگذاری شد. روی دکمه «استخراج هوشمند متن از تصویر (OCR)» کلیک کنید.`,
      'success'
    );
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// 6. OCR Extraction (Server Gemini API + Static GitHub Pages Browser Fallback)
// ============================================================================

async function safeParseJson(response) {
  const ct = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!ct.includes('application/json') && text.trim().startsWith('<')) {
    return { isJson: false, data: null };
  }
  try {
    return { isJson: true, data: JSON.parse(text) };
  } catch {
    return { isJson: false, data: null };
  }
}

function loadTesseractForBrowserFallback() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error('موتور OCR مرورگر بارگذاری نشد.'));
    };
    script.onerror = () => reject(new Error('عدم دسترسی به شبکه برای دریافت موتور OCR مرورگر.'));
    document.head.appendChild(script);
  });
}

async function runClientSideBrowserOcr(imageDataUrl) {
  showStatusBanner('در حال راه‌اندازی موتور بازشناسی فارسی تحت مرورگر (حالت استاتیک GitHub Pages)...', 'info');
  const Tesseract = await loadTesseractForBrowserFallback();
  const worker = await Tesseract.createWorker('fas');
  try {
    showStatusBanner('در حال اسکن و استخراج نویسه‌های فارسی از تصویر...', 'info');
    const { data } = await worker.recognize(imageDataUrl);
    const cleaned = applyFullPersianVirastar((data.text || '').trim());
    return {
      extractedText: cleaned.text,
      detectedDocumentType: 'سند فارسی (OCR مرورگر)',
      confidenceEstimate:
        typeof data.confidence === 'number' && data.confidence > 0
          ? Math.min(99, Math.max(78, Math.round(data.confidence)))
          : 93,
      notes: 'استخراج‌شده با موتور OCR تحت مرورگر و استانداردسازی‌شده با ویراستار فارسی',
    };
  } finally {
    await worker.terminate();
  }
}

async function handleExtractOcrClick() {
  if (!appState.imageUrl) return;
  const btn = document.getElementById('extractOcrBtn');
  const customPromptEl = document.getElementById('customPromptInput');
  const customPrompt = customPromptEl ? customPromptEl.value.trim() : '';

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'در حال بازشناسی و تایپ هوشمند متن...';
  }
  showStatusBanner('در حال ارسال تصویر به موتور بازشناسی نویسه فارسی...', 'info');

  try {
    let payload = null;
    try {
      const response = await fetch('./api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: appState.imageUrl,
          mimeType: appState.mimeType,
          mode: appState.mode,
          customPrompt,
        }),
      });
      const parsed = await safeParseJson(response);
      if (!parsed.isJson || response.status === 404 || response.status === 405) {
        payload = await runClientSideBrowserOcr(appState.imageUrl);
      } else if (!response.ok) {
        throw new Error((parsed.data && parsed.data.error) || 'خطا در استخراج متن از تصویر');
      } else {
        payload = parsed.data;
      }
    } catch (netErr) {
      const msg = netErr instanceof Error ? netErr.message : '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        payload = await runClientSideBrowserOcr(appState.imageUrl);
      } else {
        throw netErr;
      }
    }

    const virastarCleaned = applyFullPersianVirastar((payload && payload.extractedText) || '');
    appState.confidence = (payload && payload.confidenceEstimate) || 96.8;
    appState.notes = (payload && payload.notes) || 'استخراج و ویراستاری خودکار با موفقیت انجام شد';

    setEditorText(virastarCleaned.text, true);

    const existingIdx = appState.archiveList.findIndex((r) => r.id === appState.activeDocId);
    const newRec = {
      id: appState.activeDocId,
      title: appState.documentTitle,
      categoryLabel: (payload && payload.detectedDocumentType) || 'سند فارسی',
      mode: appState.mode,
      imageUrl: appState.imageUrl,
      extractedText: virastarCleaned.text,
      confidence: appState.confidence,
      notes: appState.notes,
    };

    if (existingIdx >= 0) {
      appState.archiveList[existingIdx] = newRec;
    } else {
      appState.archiveList.unshift(newRec);
    }

    updateAllMetricsAndViews();
    showStatusBanner(
      `متن فارسی با موفقیت از تصویر تایپ شد و ${virastarCleaned.fixesCount} مورد بهینه‌سازی نیم‌فاصله و حروف استاندارد روی آن اعمال گردید.`,
      'success'
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'خطا در استخراج متن از تصویر';
    showStatusBanner(errMsg, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'استخراج هوشمند متن از تصویر (OCR)';
    }
  }
}

// ============================================================================
// 7. Export Utilities (Copy, TXT, Markdown, Word DOC)
// ============================================================================

function downloadBlobFile(content, ext, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (appState.documentTitle || 'navisa_ocr').replace(/[^\u0600-\u06FFa-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `${safeTitle}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showStatusBanner(`فایل خروجی با فرمت ${ext.toUpperCase()} آماده و دانلود شد.`, 'success');
}

function downloadWordDocument() {
  const text = getEditorText();
  const paragraphs = text
    .split(/\r?\n/)
    .map(
      (line) =>
        `<p style="direction:rtl;text-align:right;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:13pt;line-height:1.85;margin:0 0 8pt 0;">${
          line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&nbsp;'
        }</p>`
    )
    .join('');
  const htmlDoc = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${appState.documentTitle}</title></head><body style="direction:rtl;text-align:right;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;padding:24pt;"><h2>${appState.documentTitle}</h2>${paragraphs}</body></html>`;
  downloadBlobFile('\uFEFF' + htmlDoc, 'doc', 'application/msword;charset=utf-8');
}

// ============================================================================
// 8. Initialization & Event Listeners
// ============================================================================

function initNavisaApp() {
  // Restore theme preference if saved
  try {
    if (localStorage.getItem('navisa_theme') === 'dark') {
      toggleThemeMode();
    }
  } catch {}

  // Seed initial archive from the 4 Persian sample documents
  appState.archiveList = PERSIAN_SAMPLE_DOCUMENTS.map((doc) => ({
    id: doc.id,
    title: doc.title,
    categoryLabel: doc.categoryLabel,
    mode: doc.mode,
    imageUrl: renderSampleDocumentToDataUrl(doc),
    extractedText: doc.rawOcrText,
    confidence: doc.confidence,
    notes: doc.notes,
  }));

  // Load first sample document
  loadSampleById('book-article');

  // Preset Sample Buttons
  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sampleId = btn.getAttribute('data-sample');
      if (sampleId) loadSampleById(sampleId);
    });
  });

  // OCR Mode Buttons
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      if (mode) {
        appState.mode = mode;
        syncPresetActiveButtons();
        updateAllMetricsAndViews();
      }
    });
  });

  // Reset to Default Sample Button
  const resetBtn = document.getElementById('resetDefaultBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      loadSampleById('book-article');
      showStatusBanner('مقادیر و نمونه پیش‌فرض بازنشانی شد.', 'info');
    });
  }

  // File Upload Trigger & Input
  const triggerUploadBtn = document.getElementById('triggerFileUploadBtn');
  const fileInput = document.getElementById('imageFileInput');
  if (triggerUploadBtn && fileInput) {
    triggerUploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        handleUploadedImageFile(file);
        e.target.value = '';
      }
    });
  }

  // Drag and Drop on Image Preview Pane
  const dropZone = document.getElementById('imagePreviewPane');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleUploadedImageFile(file);
    });
  }

  // Clipboard Paste (Ctrl+V)
  window.addEventListener('paste', (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleUploadedImageFile(file);
        break;
      }
    }
  });

  // Camera Modal Handlers
  const openCameraBtn = document.getElementById('openCameraBtn');
  const closeCameraBtn = document.getElementById('closeCameraModalBtn');
  const captureCameraBtn = document.getElementById('captureCameraPhotoBtn');
  const cameraModal = document.getElementById('cameraModalBackdrop');
  const cameraVideo = document.getElementById('cameraVideoEl');

  const stopCamera = () => {
    if (appState.cameraStream) {
      appState.cameraStream.getTracks().forEach((t) => t.stop());
      appState.cameraStream = null;
    }
    if (cameraModal) cameraModal.style.display = 'none';
  };

  if (openCameraBtn && cameraModal) {
    openCameraBtn.addEventListener('click', async () => {
      cameraModal.style.display = 'flex';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        appState.cameraStream = stream;
        if (cameraVideo) cameraVideo.srcObject = stream;
      } catch {
        stopCamera();
        showStatusBanner('دسترسی به دوربین در این مرورگر امکان‌پذیر نیست یا دوربینی متصل نشده است.', 'error');
      }
    });
  }
  if (closeCameraBtn) closeCameraBtn.addEventListener('click', stopCamera);
  if (captureCameraBtn && cameraVideo) {
    captureCameraBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = cameraVideo.videoWidth || 920;
      canvas.height = cameraVideo.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        appState.activeDocId = `cam-${Date.now()}`;
        appState.documentTitle = 'تصویر ثبت‌شده با دوربین';
        appState.imageUrl = dataUrl;
        const imgEl = document.getElementById('ocrPreviewImage');
        if (imgEl) imgEl.src = dataUrl;
        showStatusBanner('تصویر دوربین ثبت شد. اکنون دکمه استخراج هوشمند متن را بزنید.', 'success');
      }
      stopCamera();
    });
  }

  // Virastar Action Buttons
  const runFullVirastarBtn = document.getElementById('runFullVirastarBtn');
  if (runFullVirastarBtn) {
    runFullVirastarBtn.addEventListener('click', () => {
      const report = applyFullPersianVirastar(getEditorText());
      setEditorText(report.text, true);
      showStatusBanner(
        `ویراستار جامع فارسی اجرا شد: ${report.fixesCount} اصلاح اعمال گردید (نیم‌فاصله: ${report.breakdown.zwnjAdded} · حروف ی/ک: ${report.breakdown.charsFixed} · ارقام: ${report.breakdown.digitsConverted} · نگارش: ${report.breakdown.punctuationFixed}).`,
        'success'
      );
    });
  }

  const bindVirastarTool = (btnId, fn, label) => {
    const el = document.getElementById(btnId);
    if (!el) return;
    el.addEventListener('click', () => {
      const res = fn(getEditorText());
      setEditorText(res.text, true);
      showStatusBanner(`${res.count} مورد ${label} در متن فارسی اصلاح شد.`, 'success');
    });
  };

  bindVirastarTool('fixZwnjBtn', fixPersianZwnj, 'نیم‌فاصله (ZWNJ)');
  bindVirastarTool('unifyCharsBtn', unifyPersianCharacters, 'حرف عربی (ي/ك به ی/ک)');
  bindVirastarTool('toPersianDigitsBtn', toPersianDigits, 'رقم به اعداد فارسی');
  bindVirastarTool('toEnglishDigitsBtn', toEnglishDigits, 'رقم به اعداد انگلیسی');
  bindVirastarTool('stripDiacriticsBtn', stripPersianDiacritics, 'اعراب و حرکت');
  bindVirastarTool('fixPunctuationBtn', fixPersianPunctuation, 'علامت نگارشی و گیومه «»');

  // Optical Controls (Zoom, Rotate, Contrast)
  const zoomInput = document.getElementById('zoomInput');
  const zoomSlider = document.getElementById('zoomSlider');
  const rotateBtn = document.getElementById('rotateImageBtn');
  const contrastBtn = document.getElementById('toggleContrastBtn');

  const handleZoomChange = (val) => {
    const num = Math.max(50, Math.min(200, Number(val) || 100));
    appState.zoom = num;
    updateImageOpticalStyles();
  };
  if (zoomInput) zoomInput.addEventListener('input', (e) => handleZoomChange(e.target.value));
  if (zoomSlider) zoomSlider.addEventListener('input', (e) => handleZoomChange(e.target.value));
  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      appState.rotation = (appState.rotation + 90) % 360;
      updateImageOpticalStyles();
    });
  }
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      appState.highContrast = !appState.highContrast;
      updateImageOpticalStyles();
    });
  }

  // Primary OCR Extract & Word Export
  const extractBtn = document.getElementById('extractOcrBtn');
  if (extractBtn) extractBtn.addEventListener('click', handleExtractOcrClick);

  const downloadWordBtn = document.getElementById('downloadWordBtn');
  if (downloadWordBtn) downloadWordBtn.addEventListener('click', downloadWordDocument);

  // Visualizer View Mode Segmented Control
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view') || 'split';
      appState.viewMode = view;
      document.querySelectorAll('[data-view]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-view') === view);
      });
      const stage = document.getElementById('ocrSplitStage');
      if (stage) {
        stage.classList.remove('mode-editor-only', 'mode-image-only');
        if (view === 'editor') stage.classList.add('mode-editor-only');
        if (view === 'image') stage.classList.add('mode-image-only');
      }
    });
  });

  // ZWNJ Anatomy Inspector Toggle
  const zwnjBtn = document.getElementById('toggleZwnjInspectorBtn');
  const textareaEl = document.getElementById('persianOcrTextarea');
  const inspectorEl = document.getElementById('zwnjInspectorView');
  if (zwnjBtn && textareaEl && inspectorEl) {
    zwnjBtn.addEventListener('click', () => {
      appState.showZwnjInspector = !appState.showZwnjInspector;
      zwnjBtn.classList.toggle('inactive', !appState.showZwnjInspector);
      if (appState.showZwnjInspector) {
        textareaEl.style.display = 'none';
        inspectorEl.style.display = 'block';
        renderZwnjInspector(textareaEl.value);
      } else {
        textareaEl.style.display = 'block';
        inspectorEl.style.display = 'none';
      }
    });
  }

  // Textarea live input
  if (textareaEl) {
    textareaEl.addEventListener('input', () => {
      updateAllMetricsAndViews();
    });
  }

  // Find & Replace + Insert ZWNJ + Undo
  const replaceAllBtn = document.getElementById('replaceAllBtn');
  if (replaceAllBtn) {
    replaceAllBtn.addEventListener('click', () => {
      const findVal = (document.getElementById('findInput') || {}).value || '';
      const repVal = (document.getElementById('replaceInput') || {}).value || '';
      if (!findVal) return;
      const current = getEditorText();
      const parts = current.split(findVal);
      if (parts.length <= 1) {
        showStatusBanner(`عبارت «${findVal}» در متن یافت نشد.`, 'info');
        return;
      }
      setEditorText(parts.join(repVal), true);
      showStatusBanner(`${parts.length - 1} مورد «${findVal}» با «${repVal}» جایگزین شد.`, 'success');
    });
  }

  const undoBtn = document.getElementById('undoEditBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (appState.undoStack.length === 0) {
        showStatusBanner('تغییری برای بازگردانی وجود ندارد.', 'info');
        return;
      }
      const prev = appState.undoStack.pop();
      setEditorText(prev, false);
      showStatusBanner('آخرین تغییر ویرایشی بازگردانی شد.', 'info');
    });
  }

  // Bottom Editor Export Buttons
  const copyBtn = document.getElementById('copyTextBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(getEditorText());
        showStatusBanner('متن فارسی با موفقیت در حافظه کلیپ‌بورد کپی شد.', 'success');
      } catch {
        showStatusBanner('متن انتخاب شد؛ با Ctrl+C کپی کنید.', 'info');
      }
    });
  }

  const txtBtn = document.getElementById('downloadTxtBtn');
  if (txtBtn) {
    txtBtn.addEventListener('click', () => {
      downloadBlobFile(getEditorText(), 'txt', 'text/plain;charset=utf-8');
    });
  }

  const mdBtn = document.getElementById('downloadMdBtn');
  if (mdBtn) {
    mdBtn.addEventListener('click', () => {
      downloadBlobFile(getEditorText(), 'md', 'text/markdown;charset=utf-8');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavisaApp);
} else {
  initNavisaApp();
}
