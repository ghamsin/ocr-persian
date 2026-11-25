import React, { useState } from 'react';
import { Search, Trash2, ArrowUpRight, FileText } from 'lucide-react';
import { ExtractionMode, OcrDocumentRecord } from '../utils/types';

interface ArchiveSectionProps {
  records: OcrDocumentRecord[];
  activeRecordId: string;
  onSelectRecord: (record: OcrDocumentRecord) => void;
  onDeleteRecord: (id: string) => void;
}

const MODE_LABELS: Record<ExtractionMode, string> = {
  standard: 'متن چاپی و کتاب',
  structured: 'فاکتور و جدول',
  handwriting: 'دست‌خط و یادداشت',
  poetry: 'شعر و متون معرب',
};

export const ArchiveSection: React.FC<ArchiveSectionProps> = ({
  records,
  activeRecordId,
  onSelectRecord,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<'all' | ExtractionMode>('all');

  const filteredRecords = records.filter((rec) => {
    const matchesMode = modeFilter === 'all' || rec.mode === modeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      rec.title.includes(searchQuery.trim()) ||
      rec.extractedText.includes(searchQuery.trim()) ||
      rec.categoryLabel.includes(searchQuery.trim());
    return matchesMode && matchesSearch;
  });

  return (
    <section
      id="archive-section"
      aria-label="آرشیو و تاریخچه اسناد پردازش‌شده"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">آرشیو اسناد و متون استخراج‌شده</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تمامی اسناد پردازش‌شده در حافظه مرورگر شما ذخیره می‌شوند تا در هر زمان به متن آن‌ها دسترسی داشته باشید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'standard', 'structured', 'handwriting', 'poetry'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setModeFilter(filterKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  modeFilter === filterKey
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filterKey === 'all' ? 'همه اسناد' : MODE_LABELS[filterKey]}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در آرشیو اسناد..."
              aria-label="جستجو در آرشیو اسناد"
              className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="p-10 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">هیچ سندی مطابق با فیلتر انتخابی یافت نشد</p>
          <p className="text-xs text-slate-500 mt-1">
            با بارگذاری تصویر جدید یا انتخاب یکی از نمونه‌های آماده، سند در آرشیو ثبت می‌شود.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500 font-medium">
                <th className="py-3 px-5">عنوان سند</th>
                <th className="py-3 px-4">نوع بازشناسی</th>
                <th className="py-3 px-4">بخشی از متن تایپ‌شده</th>
                <th className="py-3 px-4 text-left">دقت</th>
                <th className="py-3 px-4 text-left">تاریخ</th>
                <th className="py-3 px-5 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredRecords.map((rec) => {
                const isCurrent = rec.id === activeRecordId;
                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-5 font-semibold text-slate-900 whitespace-nowrap">
                      {rec.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {MODE_LABELS[rec.mode]}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                      {rec.extractedText.replace(/\s+/g, ' ').slice(0, 95)}...
                    </td>
                    <td className="py-3 px-4 text-left font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {rec.confidence}%
                    </td>
                    <td className="py-3 px-4 text-left font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {rec.createdAt}
                    </td>
                    <td className="py-3 px-5 text-left whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
                        >
                          <span>بازگشایی در میز کار</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        {records.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            aria-label={`حذف سند ${rec.title}`}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
