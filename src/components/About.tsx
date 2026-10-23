import React from 'react';
import { Smartphone, Cpu, ShieldCheck, Heart, ExternalLink, Code2 } from 'lucide-react';
import { APP_LOGO } from '../assets/logo.ts';

interface AboutProps {
  appVersion: string;
  adbVersion: string | null;
  platform: string;
}

export const About: React.FC<AboutProps> = ({ appVersion, adbVersion, platform }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white dark:bg-jb-panel rounded p-6 border border-slate-200 dark:border-jb-border shadow-xs text-center">
        {/* App Logo posicionado diretamente em cima do nome */}
        <div className="mx-auto flex items-center justify-center mb-3">
          <img
            src={APP_LOGO}
            alt="FunnelPeek Next"
            className="w-16 h-16 object-contain drop-shadow-sm select-none"
          />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-jb-text tracking-tight">
          FunnelPeek Next
        </h2>
        <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-jb-elevated text-slate-700 dark:text-jb-text border border-slate-200 dark:border-jb-border">
          v{appVersion}
        </span>

        <p className="text-xs text-slate-600 dark:text-jb-textMuted max-w-lg mx-auto mt-2">
          Visualizador de hierarquia UI Android de alta performance, sequenciador de fluxos de telas (Funnel Flow) e gerador automatizado de seletores.
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

        {/* Credits & Authorship */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-jb-border text-xs text-slate-400 dark:text-jb-textMuted max-w-xl mx-auto space-y-2.5">
          {/* Caixa de autoria sóbria e profissional */}
          <div className="p-3 rounded bg-slate-50 dark:bg-jb-elevated/60 border border-slate-200 dark:border-jb-border text-center">
            <span className="text-[11px] text-slate-400 dark:text-jb-textMuted block uppercase tracking-wider">
              Liderança & Desenvolvimento do Projeto
            </span>
            <span className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5 block">
              Guilherme Socalschi
            </span>
          </div>

          <div className="pt-1 space-y-1">
            <p>
              FunnelPeek original concebido por <strong>Saeed Roshan</strong>.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-jb-textMuted">
              Reconstruído e potencializado com <strong>TypeScript, Fast Vite HMR, Detecção Automática de ADB, Multi-screen Funnel Flow & Seletores Maestro / Appium</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
