import React, { useEffect, useRef, useState } from 'react';
import { TopBar, ActiveSection } from './components/TopBar';
import { ImageWorkspace } from './components/ImageWorkspace';
import { EditorWorkspace } from './components/EditorWorkspace';
import { ArchiveSection } from './components/ArchiveSection';
import {
  PERSIAN_SAMPLE_DOCUMENTS,
  SampleDocument,
  renderSampleDocumentToDataUrl,
} from './utils/sampleDocuments';
import { ExtractionMode, OcrDocumentRecord } from './utils/types';
import { applyFullPersianVirastar } from './utils/persianOrthography';

const STORAGE_KEY = 'navisa_persian_ocr_records_v1';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('workspace');

  // Active workspace states
  const [activeSampleId, setActiveSampleId] = useState<string>(PERSIAN_SAMPLE_DOCUMENTS[0].id);
  const [documentTitle, setDocumentTitle] = useState<string>(PERSIAN_SAMPLE_DOCUMENTS[0].title);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [mode, setMode] = useState<ExtractionMode>(PERSIAN_SAMPLE_DOCUMENTS[0].mode);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>(PERSIAN_SAMPLE_DOCUMENTS[0].rawOcrText);
  const [confidence, setConfidence] = useState<number>(PERSIAN_SAMPLE_DOCUMENTS[0].confidence);
  const [notes, setNotes] = useState<string>(PERSIAN_SAMPLE_DOCUMENTS[0].notes);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSmartEditing, setIsSmartEditing] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  const [archiveRecords, setArchiveRecords] = useState<OcrDocumentRecord[]>([]);

  // Initialize sample canvas images and archive on first load
  useEffect(() => {
    const firstSample = PERSIAN_SAMPLE_DOCUMENTS[0];
    const generatedUrl = renderSampleDocumentToDataUrl(firstSample);
    setImageUrl(generatedUrl);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OcrDocumentRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArchiveRecords(parsed);
          return;
        }
      }
    } catch {
      // ignore storage errors
    }

    // Seed initial archive from built-in Persian sample documents
    const seeded: OcrDocumentRecord[] = PERSIAN_SAMPLE_DOCUMENTS.map((sample, idx) => ({
      id: sample.id,
      title: sample.title,
      categoryLabel: sample.categoryLabel,
      mode: sample.mode,
      imageUrl: idx === 0 ? generatedUrl : '',
      mimeType: 'image/png',
      extractedText: sample.rawOcrText,
      confidence: sample.confidence,
      notes: sample.notes,
      createdAt: '۱۴۰۴/۰۸/۲۵',
    }));
    setArchiveRecords(seeded);
  }, []);

  // Save archive records whenever updated
  useEffect(() => {
    if (archiveRecords.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(archiveRecords.slice(0, 20)));
      } catch {
        // ignore quota errors
      }
    }
  }, [archiveRecords]);

  // Global clipboard paste support (Ctrl+V image anywhere)
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelected(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  const handleSelectSample = (sample: SampleDocument) => {
    const dataUrl = renderSampleDocumentToDataUrl(sample);
    setActiveSampleId(sample.id);
    setDocumentTitle(sample.title);
    setImageUrl(dataUrl);
    setMimeType('image/png');
    setMode(sample.mode);
    setExtractedText(sample.rawOcrText);
    setConfidence(sample.confidence);
    setNotes(sample.notes);
    setStatusBanner({
      type: 'info',
      message: `نمونه «${sample.title}» بارگذاری شد. می‌توانید از نوار ابزار ویراستار فارسی برای اصلاح نیم‌فاصله‌ها استفاده کنید یا استخراج مجدد با هوش مصنوعی را بزنید.`,
    });
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setActiveSampleId('');
      setDocumentTitle(`سند بارگذاری‌شده: ${cleanName}`);
      setImageUrl(dataUrl);
      setMimeType(file.type || 'image/png');
      setStatusBanner({
        type: 'info',
        message: `تصویر «${file.name}» آماده پردازش است. روی دکمه «استخراج و تایپ هوشمند متن از تصویر» کلیک کنید.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDataUrlCaptured = (dataUrl: string, title: string) => {
    setActiveSampleId('');
    setDocumentTitle(title);
    setImageUrl(dataUrl);
    setMimeType('image/png');
    setStatusBanner({
      type: 'info',
      message: 'تصویر دوربین ثبت شد. اکنون دکمه استخراج و تایپ هوشمند متن را بزنید.',
    });
  };

  const handleExtractOcr = async () => {
    if (!imageUrl) return;
    setIsExtracting(true);
    setStatusBanner({
      type: 'info',
      message: 'در حال ارسال تصویر به موتور بازشناسی نویسه فارسی (Gemini OCR)...',
    });

    try {
      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageUrl,
          mimeType,
          mode,
          customPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'خطا در استخراج متن از تصویر');
      }

      const virastarCleaned = applyFullPersianVirastar(data.extractedText || '');
      const finalText = virastarCleaned.text;

      setExtractedText(finalText);
      setConfidence(data.confidenceEstimate || 97);
      setNotes(data.notes || 'استخراج و ویراستاری خودکار با موفقیت انجام شد.');

      const newRecord: OcrDocumentRecord = {
        id: `doc-${Date.now()}`,
        title: documentTitle,
        categoryLabel: data.detectedDocumentType || 'سند فارسی',
        mode,
        imageUrl,
        mimeType,
        extractedText: finalText,
        confidence: data.confidenceEstimate || 97,
        notes: data.notes || 'استخراج‌شده با هوش مصنوعی',
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };

      setArchiveRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
      setStatusBanner({
        type: 'success',
        message: `متن فارسی با موفقیت از تصویر تایپ شد و ${virastarCleaned.fixesCount.toLocaleString('fa-IR')} مورد بهینه‌سازی نیم‌فاصله و حروف استاندارد روی آن اعمال گردید.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ارتباط با سرور استخراج متن';
      setStatusBanner({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRunSmartAiEdit = async (action: 'proofread' | 'formalize' | 'summarize') => {
    if (!extractedText.trim()) return;
    setIsSmartEditing(true);
    try {
      const response = await fetch('/api/ocr/smart-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          action,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'خطا در بازخوانی هوشمند متن');
      }
      const refined = applyFullPersianVirastar(data.resultText || extractedText);
      setExtractedText(refined.text);
      setStatusBanner({
        type: 'success',
        message: 'پردازش هوشمند و استانداردسازی نگارش فارسی با موفقیت انجام شد.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در بازخوانی هوشمند';
      setStatusBanner({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsSmartEditing(false);
    }
  };

  const handleSelectNavigation = (section: ActiveSection) => {
    setActiveSection(section);
    if (section === 'archive') {
      document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'virastar') {
      document.getElementById('persian-ocr-editor')?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        activeSection={activeSection}
        onSelectSection={handleSelectNavigation}
        onTriggerUpload={() => fileInputRef.current?.click()}
        archiveCount={archiveRecords.length}
      />

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Workspace Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              تبدیل تخصصی تصویر به متن فارسی (Persian OCR &amp; Virastar)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              بازشناسی دقیق کتاب‌های چاپی، دست‌خط، فاکتورها و متون کهن همراه با موتور خودکار اصلاح نیم‌فاصله، استانداردسازی حروف «ی/ک» و ارقام فارسی
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>پشتیبانی از ۴ حالت بازشناسی</span>
            <span aria-hidden="true">·</span>
            <span>خروجی TXT، Markdown و Word</span>
          </div>
        </div>

        {/* Two-Column Split Studio: Image Viewer (Right in RTL) + Persian Editor & Virastar (Left in RTL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <ImageWorkspace
              imageUrl={imageUrl}
              documentTitle={documentTitle}
              mode={mode}
              onModeChange={setMode}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              isExtracting={isExtracting}
              onExtractOcr={handleExtractOcr}
              onFileSelected={handleFileSelected}
              onDataUrlCaptured={handleDataUrlCaptured}
              samples={PERSIAN_SAMPLE_DOCUMENTS}
              activeSampleId={activeSampleId}
              onSelectSample={handleSelectSample}
              fileInputRef={fileInputRef}
            />
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <EditorWorkspace
              text={extractedText}
              onChangeText={setExtractedText}
              documentTitle={documentTitle}
              confidence={confidence}
              notes={notes}
              statusBanner={statusBanner}
              onUpdateStatus={setStatusBanner}
              isSmartEditing={isSmartEditing}
              onRunSmartAiEdit={handleRunSmartAiEdit}
            />
          </div>
        </div>

        {/* Persian Orthography Guide & Mechanism-to-Outcome Strip */}
        <section
          aria-label="ویژگی‌های تخصصی پردازش خط فارسی"
          className="bg-white border border-slate-200 rounded-xl p-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200">
            <div className="pt-3 md:pt-0 md:pl-4">
              <h3 className="text-xs font-bold text-slate-900">۰۱. مهندسی نیم‌فاصله (ZWNJ) و پیشوندها</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                تشخیص و اصلاح خودکار فاصله‌های اشتباه در افعال («می شود» به «می‌شود»)، پسوندهای جمع («کتاب ها» به «کتاب‌ها») و صفات تفضیلی («بزرگ تر» به «بزرگ‌تر»).
              </p>
            </div>
            <div className="pt-3 md:pt-0 md:px-4">
              <h3 className="text-xs font-bold text-slate-900">۰۲. یکپارچه‌سازی کدگذاری یونیکد فارسی</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                پاک‌سازی نویسه‌های عربی «ي» و «ك» که در خروجی اسکنرها باعث اختلال در جستجوی متون می‌شوند و جایگزینی با «ی» و «ک» استاندارد ملی ایران.
              </p>
            </div>
            <div className="pt-3 md:pt-0 md:pr-4">
              <h3 className="text-xs font-bold text-slate-900">۰۳. بازخوانی جداول، دست‌خط و متون معرب</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                حفظ ساختار ستونی فاکتورها در قالب Markdown، رمزگشایی یادداشت‌های دست‌نویس بر اساس بافت معنایی جمله و مدیریت اعراب در اشعار کهن.
              </p>
            </div>
          </div>
        </section>

        {/* Saved OCR Documents Archive Table */}
        <ArchiveSection
          records={archiveRecords}
          activeRecordId={activeSampleId}
          onSelectRecord={(rec) => {
            setActiveSampleId(rec.id);
            setDocumentTitle(rec.title);
            const matchingSample = PERSIAN_SAMPLE_DOCUMENTS.find((s) => s.id === rec.id);
            if (matchingSample) {
              setImageUrl(renderSampleDocumentToDataUrl(matchingSample));
            } else if (rec.imageUrl) {
              setImageUrl(rec.imageUrl);
            }
            setMode(rec.mode);
            setExtractedText(rec.extractedText);
            setConfidence(rec.confidence);
            setNotes(rec.notes);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDeleteRecord={(id) => {
            setArchiveRecords((prev) => prev.filter((item) => item.id !== id));
          }}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 mt-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>نویسا — میز کار تخصصی بازشناسی نویسه نوری (OCR) و ویراستاری زبان فارسی</span>
          <span>طراحی‌شده برای تایپ سریع اسناد، کتاب‌ها، دست‌خط و جداول فارسی</span>
        </div>
      </footer>
    </div>
  );
}
