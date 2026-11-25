import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  ScanText,
  FileText,
  Table2,
  PenTool,
  Feather,
  RefreshCw,
  X,
} from 'lucide-react';
import { ExtractionMode } from '../utils/types';
import { SampleDocument } from '../utils/sampleDocuments';

interface ImageWorkspaceProps {
  imageUrl: string;
  documentTitle: string;
  mode: ExtractionMode;
  onModeChange: (mode: ExtractionMode) => void;
  customPrompt: string;
  onCustomPromptChange: (val: string) => void;
  isExtracting: boolean;
  onExtractOcr: () => void;
  onFileSelected: (file: File) => void;
  onDataUrlCaptured: (dataUrl: string, title: string) => void;
  samples: SampleDocument[];
  activeSampleId: string;
  onSelectSample: (sample: SampleDocument) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const MODE_OPTIONS: Array<{
  id: ExtractionMode;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'standard',
    label: 'متن چاپی و کتاب',
    shortDesc: 'حروف‌چینی روان با رعایت نیم‌فاصله',
    icon: FileText,
  },
  {
    id: 'structured',
    label: 'فاکتور و جدول',
    shortDesc: 'حفظ ستون‌ها و ردیف‌ها با Markdown',
    icon: Table2,
  },
  {
    id: 'handwriting',
    label: 'دست‌خط و یادداشت',
    shortDesc: 'تحلیل بافت جمله برای دست‌نویس فارسی',
    icon: PenTool,
  },
  {
    id: 'poetry',
    label: 'شعر و متون معرب',
    shortDesc: 'تفکیک مصرع‌ها و حفظ کامل اعراب',
    icon: Feather,
  },
];

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  imageUrl,
  documentTitle,
  mode,
  onModeChange,
  customPrompt,
  onCustomPromptChange,
  isExtracting,
  onExtractOcr,
  onFileSelected,
  onDataUrlCaptured,
  samples,
  activeSampleId,
  onSelectSample,
  fileInputRef,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [highContrastScan, setHighContrastScan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('دسترسی به دوربین امکان‌پذیر نیست یا دوربین در این مرورگر متصل نشده است.');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 960;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      onDataUrlCaptured(dataUrl, 'تصویر ثبت‌شده با دوربین');
      closeCamera();
    }
  };

  return (
    <section
      aria-label="پنل تصویر و تنظیمات استخراج"
      className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Top Toolbar: Document Title & Quick Sample Switcher */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{documentTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تصویر سند ورودی · پشتیبانی از PNG، JPG، WEBP و جای‌گذاری مستقیم (Ctrl+V)
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>انتخاب فایل</span>
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>دوربین</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="بارگذاری فایل تصویر"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileSelected(file);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Built-in Persian Sample Documents Bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">نمونه‌های آماده آزمایشی (کلیک برای بارگذاری):</span>
          <span className="text-xs text-slate-500">۴ سند استاندارد فارسی</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {samples.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className={`px-3 py-2 text-right rounded-lg border text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-700 text-teal-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sample.categoryLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Inspection Canvas */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex-1 min-h-[260px] max-h-[380px] overflow-auto flex items-center justify-center p-4 transition-colors ${
          isDragging ? 'bg-teal-50/60' : 'bg-slate-100/80'
        }`}
      >
        {imageUrl ? (
          <div className="relative flex items-center justify-center">
            <img
              src={imageUrl}
              alt={documentTitle}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: highContrastScan ? 'contrast(1.45) grayscale(1) brightness(1.05)' : 'none',
                transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), filter 150ms ease',
              }}
              className="max-h-[330px] w-auto rounded-lg border border-slate-300 shadow-xs object-contain bg-white"
            />
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-medium text-slate-700">تصویری را اینجا رها کنید یا از دکمه انتخاب فایل استفاده نمایید</p>
            <p className="text-xs text-slate-500 mt-1">پشتیبانی از عکس کتاب، جزوه، دست‌خط، فاکتور و اسناد اداری</p>
          </div>
        )}
      </div>

      {/* Dedicated Image Optical Controls Sub-Bar (Never Overlaps Document Canvas) */}
      <div className="px-5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(180, z + 20))}
            aria-label="بزرگ‌نمایی تصویر"
            className="p-1.5 text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="px-1.5 font-mono tabular-nums text-slate-700">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 20))}
            aria-label="کوچک‌نمایی تصویر"
            className="p-1.5 text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            aria-label="چرخش ۹۰ درجه تصویر"
            className="p-1.5 text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setHighContrastScan((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            highContrastScan
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-200/70'
          }`}
        >
          <Contrast className="w-3.5 h-3.5" />
          <span>تقویت کنتراست اسکن</span>
        </button>
      </div>

      {/* Specialized Persian OCR Extraction Mode & Trigger */}
      <div className="p-5 border-t border-slate-200 bg-white space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-2">
            حالت تخصصی بازشناسی متن فارسی (OCR Mode):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onModeChange(item.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-right transition-colors cursor-pointer ${
                    active
                      ? 'bg-teal-50/70 border-teal-700 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.shortDesc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="custom-ocr-prompt" className="block text-xs font-medium text-slate-700 mb-1">
            راهنمای دلخواه برای استخراج (اختیاری):
          </label>
          <input
            id="custom-ocr-prompt"
            type="text"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="مثال: فقط جدول قیمت‌ها را استخراج کن یا پاورقی‌ها را نادیده بگیر..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={onExtractOcr}
          disabled={isExtracting || !imageUrl}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isExtracting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>در حال بازشناسی و تایپ هوشمند متن فارسی...</span>
            </>
          ) : (
            <>
              <ScanText className="w-4 h-4" />
              <span>استخراج و تایپ هوشمند متن از تصویر (OCR)</span>
            </>
          )}
        </button>
      </div>

      {/* Camera Capture Modal */}
      {cameraOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ثبت تصویر سند با دوربین"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">اسکن مستقیم با دوربین</h3>
              <button
                type="button"
                onClick={closeCamera}
                aria-label="بستن پنجره دوربین"
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              {cameraError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-slate-950 rounded-lg object-cover"
                />
              )}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 cursor-pointer"
                  >
                    ثبت عکس و انتقال به میز کار
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
