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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">ADB Configuration</h2>
              <p className="text-[11px] text-slate-500">Auto-detected Android Debug Bridge installations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Found on your machine ({detectedAdbs.length})
            </span>
            <button
              onClick={onRefreshDetected}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Rescan
            </button>
          </div>

          <div className="space-y-2">
            {detectedAdbs.map((item, idx) => {
              const isSelected = currentAdbPath?.toLowerCase() === item.path.toLowerCase();

              return (
                <div
                  key={idx}
                  onClick={() => onSelectAdb(item.path)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-100'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono truncate">{item.path}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono">
                        {item.source}
                      </span>
                    </div>
                    {item.version && (
                      <p className="text-[11px] text-slate-500 mt-0.5">Version: {item.version}</p>
                    )}
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 ml-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Browse custom */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need a different location?</span>
            <button
              onClick={handleBrowseCustom}
              disabled={isBrowsing}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <FolderSearch className="w-3.5 h-3.5" />
              Browse adb.exe...
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
