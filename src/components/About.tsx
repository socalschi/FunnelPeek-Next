import React from 'react';
import { Smartphone, Cpu, ShieldCheck, Heart, ExternalLink, Code2 } from 'lucide-react';

interface AboutProps {
  appVersion: string;
  adbVersion: string | null;
  platform: string;
}

export const About: React.FC<AboutProps> = ({ appVersion, adbVersion, platform }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        {/* App Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 p-4">
          <img src="/FP2.png" alt="FunnelPeek Next" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          FunnelPeek Next
        </h2>
        <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
          v{appVersion} (Modernized Edition)
        </span>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-3">
          A high-performance Android UI hierarchy viewer, multi-screen funnel sequencer, and automated test locator generator.
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-8 max-w-2xl mx-auto text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Architecture</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Electron 34 + Vite + React 18</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Platform</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{platform}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">ADB Engine</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {adbVersion ? adbVersion.replace('Android Debug Bridge version ', 'v') : 'Auto-detecting...'}
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 max-w-lg mx-auto space-y-2">
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
