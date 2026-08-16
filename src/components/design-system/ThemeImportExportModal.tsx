import React, { useState } from 'react';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  FileCode, 
  X,
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ThemeImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeImportExportModal: React.FC<ThemeImportExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { designConfig, exportConfigJSON, importConfigJSON, resetToDefaults } = useDesignSystem();
  const [jsonText, setJsonText] = useState(() => exportConfigJSON());
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportConfigJSON());
    setCopied(true);
    toast.success('คัดลอกรหัสการตั้งค่าดีไซน์ JSON แล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportConfigJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `som-theme-config-${designConfig.themeId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดไฟล์การตั้งค่าดีไซน์เรียบร้อย');
  };

  const handleImport = () => {
    const success = importConfigJSON(jsonText);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-soft text-brand rounded-xl border border-brand-soft">
              <FileCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                นำเข้า / ส่งออกชุดการตั้งค่าดีไซน์ (Theme JSON Import & Export)
              </h3>
              <p className="text-xs text-slate-400">
                สำรองข้อมูลหรือแชร์การตั้งค่าดีไซน์ โทเค็นสี และเลย์เอาต์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>ดาวน์โหลดไฟล์ .json</span>
            </button>

            <button
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตการตั้งค่าดีไซน์ทั้งหมดกลับเป็นค่าเริ่มต้นจากโรงงานใช่หรือไม่?')) {
                  resetToDefaults();
                  onClose();
                }
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ml-auto"
            >
              <RotateCcw size={14} />
              <span>คืนค่าโรงงาน (Factory Reset)</span>
            </button>
          </div>

          {/* JSON Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              รหัส JSON การตั้งค่าดีไซน์:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full p-3.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand outline-none text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleImport}
            className="px-5 py-2 text-xs font-bold bg-brand hover:opacity-90 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Upload size={14} />
            <span>นำเข้าการตั้งค่านี้ (Apply JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
