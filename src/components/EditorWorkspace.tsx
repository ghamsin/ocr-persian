import React, { useState } from 'react';
import {
  Wand2,
  Copy,
  Check,
  Download,
  Search,
  Eye,
  RotateCcw,
  FileDown,
  FileCode,
  RefreshCw,
} from 'lucide-react';
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
} from '../utils/persianOrthography';

interface EditorWorkspaceProps {
  text: string;
  onChangeText: (newText: string) => void;
  documentTitle: string;
  confidence: number;
  notes: string;
  statusBanner: { type: 'info' | 'success' | 'error'; message: string } | null;
  onUpdateStatus: (banner: { type: 'info' | 'success' | 'error'; message: string } | null) => void;
  isSmartEditing: boolean;
  onRunSmartAiEdit: (action: 'proofread' | 'formalize' | 'summarize') => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  text,
  onChangeText,
  documentTitle,
  confidence,
  notes,
  statusBanner,
  onUpdateStatus,
  isSmartEditing,
  onRunSmartAiEdit,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showZwnjMarkers, setShowZwnjMarkers] = useState<boolean>(false);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [fontSizeClass, setFontSizeClass] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');

  const stats = analyzePersianText(text);

  const pushUndoAndSet = (nextText: string, feedbackMessage: string) => {
    setUndoStack((prev) => [...prev.slice(-15), text]);
    onChangeText(nextText);
    onUpdateStatus({ type: 'success', message: feedbackMessage });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    onChangeText(previous);
    onUpdateStatus({ type: 'info', message: 'آخرین تغییر ویرایشی بازگردانی شد.' });
  };

  const handleRunFullVirastar = () => {
    const report = applyFullPersianVirastar(text);
    pushUndoAndSet(
      report.text,
      `ویراستار جامع فارسی اجرا شد: ${report.fixesCount.toLocaleString('fa-IR')} اصلاح (نیم‌فاصله: ${report.breakdown.zwnjAdded.toLocaleString('fa-IR')} · حروف ی/ک: ${report.breakdown.charsFixed.toLocaleString('fa-IR')} · ارقام: ${report.breakdown.digitsConverted.toLocaleString('fa-IR')} · نگارش: ${report.breakdown.punctuationFixed.toLocaleString('fa-IR')})`
    );
  };

  const handleFixZwnjOnly = () => {
    const res = fixPersianZwnj(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} مورد نیم‌فاصله (ZWNJ) در پیشوندها و پسوندهای فارسی اصلاح شد.`
    );
  };

  const handleUnifyChars = () => {
    const res = unifyPersianCharacters(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} حرف عربی (ي / ك) به حروف استاندارد فارسی (ی / ک) تبدیل شد.`
    );
  };

  const handlePersianDigits = () => {
    const res = toPersianDigits(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} رقم به اعداد استاندارد فارسی (۰-۹) تبدیل شد.`
    );
  };

  const handleEnglishDigits = () => {
    const res = toEnglishDigits(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} رقم به اعداد انگلیسی (0-9) تبدیل شد.`
    );
  };

  const handleStripDiacritics = () => {
    const res = stripPersianDiacritics(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} علامت اعراب و حرکت (فتحه، کسره، ضمه و تشدید) حذف گردید.`
    );
  };

  const handleFixPunctuation = () => {
    const res = fixPersianPunctuation(text);
    pushUndoAndSet(
      res.text,
      `${res.count.toLocaleString('fa-IR')} مورد فاصله‌گذاری علائم نگارشی و گیومه فارسی «» استانداردسازی شد.`
    );
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const parts = text.split(findQuery);
    const occurrences = parts.length - 1;
    if (occurrences === 0) {
      onUpdateStatus({ type: 'info', message: `عبارت «${findQuery}» در متن یافت نشد.` });
      return;
    }
    const nextText = parts.join(replaceQuery);
    pushUndoAndSet(
      nextText,
      `${occurrences.toLocaleString('fa-IR')} مورد «${findQuery}» با «${replaceQuery}» جایگزین شد.`
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onUpdateStatus({ type: 'success', message: 'متن فارسی با موفقیت در حافظه کلیپ‌بورد کپی شد.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onUpdateStatus({ type: 'error', message: 'امکان کپی خودکار وجود ندارد؛ متن را انتخاب و کپی کنید.' });
    }
  };

  const downloadFile = (content: string, extension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = documentTitle.replace(/[^\u0600-\u06FFa-zA-Z0-9_-]/g, '_') || 'navisa_ocr';
    a.href = url;
    a.download = `${safeName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onUpdateStatus({
      type: 'success',
      message: `فایل خروجی با فرمت ${extension.toUpperCase()} آماده و دانلود شد.`,
    });
  };

  const handleDownloadWordDoc = () => {
    const escapedLines = text
      .split(/\r?\n/)
      .map((line) => `<p style="direction:rtl;text-align:right;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:13pt;line-height:1.8;margin:0 0 8pt 0;">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&nbsp;'}</p>`)
      .join('');
    const htmlDoc = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${documentTitle}</title>
</head>
<body style="direction:rtl;text-align:right;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;padding:24pt;">
<h2 style="direction:rtl;text-align:right;">${documentTitle}</h2>
${escapedLines}
</body>
</html>`;
    downloadFile('\uFEFF' + htmlDoc, 'doc', 'application/msword;charset=utf-8');
  };

  return (
    <section
      aria-label="ویرایشگر و ویراستار تخصصی متن فارسی"
      className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header Metadata Bar (Unboxed metadata per Zero-Pill rule) */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">متن تایپ‌شده و میز ویراستاری فارسی</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>دقت تخمینی: <strong className="font-mono tabular-nums text-slate-800">{confidence}%</strong></span>
            <span aria-hidden="true">·</span>
            <span>{notes}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSearchBar((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showSearchBar
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجو و جایگزینی</span>
          </button>

          <button
            type="button"
            onClick={() => setShowZwnjMarkers((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showZwnjMarkers
                ? 'bg-teal-800 text-white border-teal-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>کالبدشکافی نیم‌فاصله‌ها</span>
          </button>

          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              aria-label="بازگردانی آخرین تغییر"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازگردانی</span>
            </button>
          )}
        </div>
      </div>

      {/* Specialized Persian Virastar Toolbar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800">
            ابزارهای تخصصی ویراستار و نگارش فارسی:
          </span>

          <button
            type="button"
            onClick={handleRunFullVirastar}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>ویراستار جامع فارسی (نیم‌فاصله + ی/ک + ارقام + نگارش)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleFixZwnjOnly}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            اصلاح نیم‌فاصله‌ها ({stats.missingZwnjSuggestions.toLocaleString('fa-IR')})
          </button>
          <button
            type="button"
            onClick={handleUnifyChars}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            استانداردسازی ی و ک ({stats.arabicCharWarnings.toLocaleString('fa-IR')})
          </button>
          <button
            type="button"
            onClick={handlePersianDigits}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            تبدیل به ارقام فارسی (۱۲۳)
          </button>
          <button
            type="button"
            onClick={handleEnglishDigits}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            تبدیل به ارقام انگلیسی (123)
          </button>
          <button
            type="button"
            onClick={handleStripDiacritics}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            حذف اعراب و حرکات
          </button>
          <button
            type="button"
            onClick={handleFixPunctuation}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            اصلاح گیومه «» و سجاوندی
          </button>
        </div>

        {/* AI Smart Text Refinement Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            بازخوانی هوشمند با هوش مصنوعی:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isSmartEditing || !text.trim()}
              onClick={() => onRunSmartAiEdit('proofread')}
              className="px-2.5 py-1 text-xs font-medium text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-md disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSmartEditing ? 'در حال پردازش...' : 'تصحیح غلط‌های املایی OCR'}
            </button>
            <button
              type="button"
              disabled={isSmartEditing || !text.trim()}
              onClick={() => onRunSmartAiEdit('formalize')}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              تبدیل به نثر رسمی و اداری
            </button>
            <button
              type="button"
              disabled={isSmartEditing || !text.trim()}
              onClick={() => onRunSmartAiEdit('summarize')}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              خلاصه‌سازی نکات کلیدی
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Find & Replace Bar */}
      {showSearchBar && (
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="جستجوی کلمه یا عبارت..."
            aria-label="جستجوی کلمه یا عبارت"
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="جایگزینی با..."
            aria-label="جایگزینی با"
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
          />
          <button
            type="button"
            onClick={handleReplaceAll}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            جایگزینی همه
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.getElementById('persian-ocr-editor') as HTMLTextAreaElement | null;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const updated = text.slice(0, start) + ZWNJ + text.slice(end);
                onChangeText(updated);
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            درج نیم‌فاصله در محل مکان‌نما
          </button>
        </div>
      )}

      {/* Status Notification Banner (Clean All-Around Border, No Left Accent Stripe) */}
      {statusBanner && (
        <div
          role="status"
          className={`mx-5 mt-3 px-3.5 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            statusBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : statusBanner.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-950'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <span>{statusBanner.message}</span>
          <button
            type="button"
            onClick={() => onUpdateStatus(null)}
            className="text-xs font-semibold underline hover:opacity-80 shrink-0 cursor-pointer"
          >
            بستن
          </button>
        </div>
      )}

      {/* Main RTL Text Editor or Visual ZWNJ Inspector */}
      <div className="relative flex-1 flex flex-col p-5">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="persian-ocr-editor" className="text-xs font-medium text-slate-600">
            متن قابل ویرایش (راست‌به‌چپ استاندارد فارسی):
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setFontSizeClass('text-sm')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                fontSizeClass === 'text-sm' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              ریز
            </button>
            <button
              type="button"
              onClick={() => setFontSizeClass('text-base')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                fontSizeClass === 'text-base' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              استاندارد
            </button>
            <button
              type="button"
              onClick={() => setFontSizeClass('text-lg')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                fontSizeClass === 'text-lg' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              درشت
            </button>
          </div>
        </div>

        {showZwnjMarkers ? (
          <div
            aria-label="پیش‌نمایش کالبدشکافی نیم‌فاصله‌ها"
            className={`w-full min-h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-xl leading-8 text-slate-900 whitespace-pre-wrap overflow-y-auto ${fontSizeClass}`}
          >
            {text.split(ZWNJ).map((segment, idx, arr) => (
              <React.Fragment key={idx}>
                <span>{segment}</span>
                {idx < arr.length - 1 && (
                  <mark
                    title="نیم‌فاصله (ZWNJ)"
                    className="inline-block mx-0.5 px-1 py-0 text-[10px] font-mono bg-teal-100 text-teal-900 border border-teal-300 rounded align-middle"
                  >
                    نیم‌فاصله
                  </mark>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <textarea
            id="persian-ocr-editor"
            dir="rtl"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="متن استخراج‌شده از تصویر در این بخش قرار می‌گیرد. همچنین می‌توانید هر متنی را برای ویراستاری و اصلاح نیم‌فاصله اینجا وارد کنید..."
            className={`w-full flex-1 min-h-[300px] p-4 bg-slate-50/60 border border-slate-200 rounded-xl leading-8 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 resize-y ${fontSizeClass}`}
          />
        )}

        {isSmartEditing && (
          <div className="absolute inset-5 bg-white/80 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>در حال بازخوانی و ویراستاری هوشمند متن فارسی...</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabular Numerals Metrics & Export Footer */}
      <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>
            کلمات: <strong className="font-mono tabular-nums text-slate-900">{stats.wordCount.toLocaleString('fa-IR')}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            نویسه‌ها: <strong className="font-mono tabular-nums text-slate-900">{stats.charCount.toLocaleString('fa-IR')}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            نیم‌فاصله فعال: <strong className="font-mono tabular-nums text-teal-800">{stats.zwnjCount.toLocaleString('fa-IR')}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            سطرها: <strong className="font-mono tabular-nums text-slate-900">{stats.lineCount.toLocaleString('fa-IR')}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
          </button>

          <button
            type="button"
            onClick={() => downloadFile(text, 'txt', 'text/plain;charset=utf-8')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود TXT</span>
          </button>

          <button
            type="button"
            onClick={() => downloadFile(text, 'md', 'text/markdown;charset=utf-8')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>دانلود Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWordDoc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>خروجی Word (DOC)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
