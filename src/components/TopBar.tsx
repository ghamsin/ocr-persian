import React from 'react';
import { Upload } from 'lucide-react';

export type ActiveSection = 'workspace' | 'samples' | 'virastar' | 'archive';

interface TopBarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onTriggerUpload: () => void;
  archiveCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectSection,
  onTriggerUpload,
  archiveCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark (single text element, one line) */}
      <a
        href="#workspace"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('workspace');
        }}
        className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
      >
        نویسا
      </a>

      {/* Zone 2: 4 concise single-line navigation links */}
      <nav aria-label="ناوبری اصلی" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
        <button
          type="button"
          onClick={() => onSelectSection('workspace')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeSection === 'workspace'
              ? 'text-teal-800 border-teal-700 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          میز کار
        </button>
        <button
          type="button"
          onClick={() => onSelectSection('samples')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeSection === 'samples'
              ? 'text-teal-800 border-teal-700 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          نمونه‌های آماده
        </button>
        <button
          type="button"
          onClick={() => onSelectSection('virastar')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeSection === 'virastar'
              ? 'text-teal-800 border-teal-700 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          ویراستار فارسی
        </button>
        <button
          type="button"
          onClick={() => onSelectSection('archive')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeSection === 'archive'
              ? 'text-teal-800 border-teal-700 font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          آرشیو اسناد ({archiveCount.toLocaleString('fa-IR')})
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onTriggerUpload}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>بارگذاری تصویر جدید</span>
        </button>
      </div>
    </header>
  );
};
