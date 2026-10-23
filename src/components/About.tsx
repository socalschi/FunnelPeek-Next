import React from 'react';
import { Smartphone, Cpu, ShieldCheck, Heart, ExternalLink, Code2 } from 'lucide-react';

interface AboutProps {
  appVersion: string;
  adbVersion: string | null;
  platform: string;
}

export const About: React.FC<AboutProps> = ({ appVersion, adbVersion, platform }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white dark:bg-jb-panel rounded p-6 border border-slate-200 dark:border-jb-border shadow-xs text-center">
        {/* App Logo */}
        <div className="w-16 h-16 rounded bg-jb-accent mx-auto flex items-center justify-center shadow-xs mb-3 p-3">
          <img src="/FP2.png" alt="FunnelPeek Next" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-jb-text tracking-tight">
          FunnelPeek Next
        </h2>
        <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-jb-hover text-jb-accent border border-blue-200 dark:border-jb-border">
          v{appVersion} (Modernized Edition)
        </span>

        <p className="text-xs text-slate-600 dark:text-jb-textMuted max-w-lg mx-auto mt-2">
          A high-performance Android UI hierarchy viewer, multi-screen funnel sequencer, and automated test locator generator.
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left mt-6 max-w-2xl mx-auto text-xs">
          <div className="p-3 rounded bg-slate-50 dark:bg-jb-elevated/40 border border-slate-200 dark:border-jb-border">
            <span className="text-slate-400 dark:text-jb-textMuted block mb-0.5 text-[11px]">Architecture</span>
            <span className="font-semibold text-slate-800 dark:text-jb-text">Electron 34 + Vite + React 18</span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-jb-elevated/40 border border-slate-200 dark:border-jb-border">
            <span className="text-slate-400 dark:text-jb-textMuted block mb-0.5 text-[11px]">Platform</span>
            <span className="font-semibold text-slate-800 dark:text-jb-text capitalize">{platform}</span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-jb-elevated/40 border border-slate-200 dark:border-jb-border">
            <span className="text-slate-400 dark:text-jb-textMuted block mb-0.5 text-[11px]">ADB Engine</span>
            <span className="font-semibold text-slate-800 dark:text-jb-text truncate block">
              {adbVersion ? adbVersion.replace('Android Debug Bridge version ', 'v') : 'Auto-detecting...'}
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-jb-border text-xs text-slate-400 dark:text-jb-textMuted max-w-lg mx-auto space-y-1.5">
          <p>
            Original FunnelPeek created by <strong>Saeed Roshan</strong>.
          </p>
          <p>
            Reconstructed & modernized with <strong>TypeScript, Fast Vite HMR, Auto-ADB Detection, Appium/Maestro Selectors & Multi-step Funnel Flow</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
