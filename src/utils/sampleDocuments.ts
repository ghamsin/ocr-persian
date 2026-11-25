import { ExtractionMode } from './types';

export interface SampleDocument {
  id: string;
  title: string;
  categoryLabel: string;
  mode: ExtractionMode;
  confidence: number;
  description: string;
  paperStyle: 'book' | 'lined' | 'invoice' | 'manuscript';
  canvasLines: string[];
  rawOcrText: string;
  notes: string;
}

export const PERSIAN_SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'book-article',
    title: 'صفحه کتاب: تاریخچه خط و چاپ در ایران',
    categoryLabel: 'کتاب و مقاله چاپی',
    mode: 'standard',
    confidence: 98.4,
    description: 'نمونه متن چاپی کتاب با حروف ي/ك عربی، اعداد انگلیسی و نیم‌فاصله‌های جاافتاده برای آزمایش موتور ویراستار فارسی.',
    paperStyle: 'book',
    canvasLines: [
      'فصل سوم: تحول صنعت چاپ و نشر در ایران',
      'در سال 1233 هجری قمری، نخستین چاپخانه سربی در تبریز آغاز به کار کرد.',
      'پژوهشگران معتقدند که کتاب ها و رساله های علمی این دوره نقش',
      'بی نظیری در گسترش آگاهی عمومی ایفا می کنند. در کتابخانه های',
      'ملی ایران بیش از 4500 نسخه خطی و چاپی کهن نگهداری می شود',
      'که نشان دهنده دقت بالای استادان خوشنویس و حروفچین است.'
    ],
    rawOcrText: `فصل سوم: تحول صنعت چاپ و نشر در ایران

در سال 1233 هجری قمری ، نخستین چاپخانه سربی در تبریز آغاز به كار كرد . پژوهشگران معتقدند كه كتاب ها و رساله هاي علمی این دوره نقش بی نظیری در گسترش آگاهی عمومی ایفا می كنند .

در كتابخانه هاي ملی ایران بیش از 4500 نسخه خطی و چاپی كهن نگهداری میشود كه نشان دهنده دقت بالای استادان خوشنویس است . بسیاری از نویسندگان در مقدمه آثار خود گفته اند : "حفظ و بازآفرینی متون پارسی ، میراث ماندگار فرهنگ ماست" .`,
    notes: 'تشخیص ستون متنی کتاب با وضوح بالا — شامل ۱۳ مورد پیشنهاد اصلاح نیم‌فاصله و حروف استاندارد فارسی.'
  },
  {
    id: 'handwriting-note',
    title: 'دست‌خط: صورت‌جلسه برنامه‌ریزی محصول',
    categoryLabel: 'دست‌خط و یادداشت',
    mode: 'handwriting',
    confidence: 94.2,
    description: 'یادداشت دست‌نویس فارسی از جلسه کاری روی کاغذ خط‌دار با ساختار بندهای اجرایی.',
    paperStyle: 'lined',
    canvasLines: [
      'یادداشت جلسه فنی - چهارشنبه ۱۴ آبان ۱۴۰۴',
      '۱. بهینه‌سازی سرعت پردازش تصاویر اسکن‌شده تا ۴۰ درصد',
      '۲. افزودن قابلیت تشخیص خودکار نیم‌فاصله و اعداد فارسی',
      '۳. پشتیبانی از خروجی مستقیم فایل ورد (DOC) و مارک‌داون',
      '۴. تحویل نسخه آزمایشی به تیم کنترل کیفیت تا پایان هفته'
    ],
    rawOcrText: `یادداشت جلسه فنی - چهارشنبه 14 آبان 1404

۱. بهینه سازی سرعت پردازش تصاویر اسکن شده تا 40 درصد
۲. افزودن قابلیت تشخیص خودکار نیم فاصله ها و اعداد فارسی
۳. پشتیبانی از خروجی مستقیم فایل ورد (DOC) و مارک داون
۴. تحویل نسخه آزمایشی به تیم کنترل کیفیت تا پایان هفته آینده

یادآوری مهم: تمام فرم ها و گزارش های مالی باید پیش از ارسال نهایی بازبینی شوند .`,
    notes: 'دست‌خط تحریری فارسی با موفقیت رمزگشایی و به متن استاندارد تبدیل شد.'
  },
  {
    id: 'invoice-table',
    title: 'فاکتور رسمی: صورت‌حساب خدمات نرم‌افزاری',
    categoryLabel: 'جدول و سند اداری',
    mode: 'structured',
    confidence: 97.8,
    description: 'فاکتور رسمی شرکت با جدول ردیف‌ها، مبالغ ریالی و جمع کل در قالب Markdown.',
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
      'جمع کل قابل پرداخت: ۵۰,۰۰۰,۰۰۰ تومان'
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
    notes: 'ساختار جدول ۴ ستونه و ارقام مالی با قالب‌بندی Markdown استخراج گردید.'
  },
  {
    id: 'classical-poetry',
    title: 'شعر و متون کهن: غزل حافظ با اعراب کامل',
    categoryLabel: 'شعر و متون معرب',
    mode: 'poetry',
    confidence: 96.5,
    description: 'نمونه شعر کلاسیک فارسی همراه با اعراب و حرکات (فتحه، کسره، ضمه و تشدید) برای تست حفظ یا حذف اعراب.',
    paperStyle: 'manuscript',
    canvasLines: [
      'غزلیات حافظ شیرازی — نسخه تصحیح قزوینی',
      'دوش دیدَم که مَلائِک دَرِ مِیخانه زَدَند',
      'گِلِ آدَم بِسِرِشتَند و به پِیمانه زَدَند',
      'ساکِنانِ حَرَمِ سِتْر و عَفافِ مَلَکوت',
      'با مَنِ راه نِشین بادهٔ مَستانه زَدَند'
    ],
    rawOcrText: `غزلیات حافظ شیرازی — نسخه تصحیح قزوینی و غنی

دوش دیدَم که مَلائِک دَرِ مِیخانه زَدَند
گِلِ آدَم بِسِرِشتَند و به پِیمانه زَدَند

ساکِنانِ حَرَمِ سِتْر و عَفافِ مَلَکوت
با مَنِ راه‌نِشین بادهٔ مَستانه زَدَند

آسمان بارِ اَمانَت نَتَوانِست کَشید
قُرعهٔ کار به نامِ مَنِ دیوانه زَدَند`,
    notes: 'ابیات با تفکیک مصرع‌ها و حفظ کامل حرکات و اعراب استخراج شد.'
  }
];

/**
 * Generates a realistic, high-resolution Persian document image on an HTML5 Canvas
 * so sample documents always display crisp, authentic visual scans with zero network dependency.
 */
export function renderSampleDocumentToDataUrl(doc: SampleDocument): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Paper background based on style
  if (doc.paperStyle === 'book') {
    ctx.fillStyle = '#FCFBF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Subtle book border frame
    ctx.strokeStyle = '#D6D1C4';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
    ctx.strokeStyle = '#E8E3D9';
    ctx.lineWidth = 1;
    ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);
  } else if (doc.paperStyle === 'lined') {
    ctx.fillStyle = '#FEFDF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ruled horizontal notebook lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    for (let y = 110; y < canvas.height - 50; y += 72) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(canvas.width - 48, y);
      ctx.stroke();
    }
    // Vertical margin line on the right (RTL notebook)
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 82, 36);
    ctx.lineTo(canvas.width - 82, canvas.height - 36);
    ctx.stroke();
  } else if (doc.paperStyle === 'invoice') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Header band
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(36, 36, canvas.width - 72, 95);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  } else {
    // Classical manuscript style
    ctx.fillStyle = '#F9F5EB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#B49B6B';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.strokeStyle = '#D5C39C';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
  }

  // Configure RTL Persian text rendering
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  const startX = doc.paperStyle === 'lined' ? canvas.width - 105 : canvas.width - 76;
  let currentY = 98;

  doc.canvasLines.forEach((line, index) => {
    if (index === 0) {
      ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
      ctx.fillStyle = doc.paperStyle === 'manuscript' ? '#78350F' : '#0F172A';
      ctx.fillText(line, startX, currentY);
      currentY += 82;
    } else {
      if (doc.paperStyle === 'lined') {
        ctx.font = '500 24px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#1E3A8A';
      } else if (doc.paperStyle === 'invoice') {
        ctx.font = '500 21px Vazirmatn, monospace, Tahoma';
        ctx.fillStyle = '#1E293B';
      } else if (doc.paperStyle === 'manuscript') {
        ctx.font = '500 26px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#292524';
      } else {
        ctx.font = '400 24px Vazirmatn, Tahoma, sans-serif';
        ctx.fillStyle = '#1E293B';
      }
      ctx.fillText(line, startX, currentY);
      currentY += doc.paperStyle === 'invoice' ? 56 : 72;
    }
  });

  // Footer stamp / page number
  ctx.font = '400 16px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText(`برگه نمونه آزمایشی نویسا · ${doc.categoryLabel}`, 76, canvas.height - 62);

  return canvas.toDataURL('image/png');
}
