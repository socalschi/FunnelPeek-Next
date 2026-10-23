import React, { useState } from 'react';
import { X, Terminal, CheckCircle2, FolderSearch, RefreshCw, AlertCircle } from 'lucide-react';
import { DetectedAdb } from '../types/index.ts';

interface AdbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdbPath: string | null;
  detectedAdbs: DetectedAdb[];
  onSelectAdb: (path: string) => Promise<void>;
  onRefreshDetected: () => Promise<void>;
}

export const AdbConfigModal: React.FC<AdbConfigModalProps> = ({
  isOpen,
  onClose,
  currentAdbPath,
  detectedAdbs,
  onSelectAdb,
  onRefreshDetected
}) => {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBrowseCustom = async () => {
    if (!window.electronAPI) {
      setErrorMsg('Electron API bridge is not available. Please verify the application is running in Electron.');
      return;
    }
    setIsBrowsing(true);
    setErrorMsg(null);
    try {
      const res = await window.electronAPI.selectAdbFile();
      if (!res.canceled && res.filePath) {
        await onSelectAdb(res.filePath);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to select ADB executable');
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-jb-elevated rounded-lg shadow-xl border border-slate-200 dark:border-jb-border overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-jb-border flex items-center justify-between bg-slate-50 dark:bg-jb-panel">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-100 dark:bg-jb-hover text-jb-accent border border-blue-200 dark:border-jb-border">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-jb-text">ADB Configuration</h2>
              <p className="text-[11px] text-slate-500 dark:text-jb-textMuted">Auto-detected Android Debug Bridge installations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-jb-text">
              Found on your machine ({detectedAdbs.length})
            </span>
            <button
              onClick={onRefreshDetected}
              className="text-xs text-blue-600 dark:text-jb-accent hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Rescan
            </button>
          </div>

          <div className="space-y-1.5">
            {detectedAdbs.map((item, idx) => {
              const isSelected = currentAdbPath?.toLowerCase() === item.path.toLowerCase();

              return (
                <div
                  key={idx}
                  onClick={() => onSelectAdb(item.path)}
                  className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-jb-accentHover/70 border-jb-accent text-blue-950 dark:text-white'
                      : 'bg-slate-50 dark:bg-jb-panel/50 border-slate-200 dark:border-jb-border hover:border-jb-borderStrong'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono truncate">{item.path}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-jb-elevated text-slate-600 dark:text-jb-textMuted uppercase font-mono border border-slate-300 dark:border-jb-border">
                        {item.source}
                      </span>
                    </div>
                    {item.version && (
                      <p className="text-[11px] text-slate-500 dark:text-jb-textMuted mt-0.5">Version: {item.version}</p>
                    )}
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-jb-success shrink-0 ml-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Browse custom */}
          <div className="pt-2 border-t border-slate-100 dark:border-jb-border flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-jb-textMuted">Need a different location?</span>
            <button
              onClick={handleBrowseCustom}
              disabled={isBrowsing}
              className="px-3 py-1.5 rounded bg-slate-100 dark:bg-jb-panel hover:bg-slate-200 dark:hover:bg-jb-hover border border-slate-200 dark:border-jb-border text-xs font-medium text-slate-800 dark:text-jb-text flex items-center gap-1.5 transition-colors"
            >
              <FolderSearch className="w-3.5 h-3.5" />
              Browse adb.exe...
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-[#351E20] border border-rose-200 dark:border-jb-error/40 text-xs text-rose-700 dark:text-jb-error flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
