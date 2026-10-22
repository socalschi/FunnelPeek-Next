import React from 'react';
import { Menu, Smartphone, Moon, Sun, Terminal } from 'lucide-react';
import { Device } from '../types/index.ts';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedDevice: string | null;
  devices: Device[];
  adbPath: string | null;
  adbVersion: string | null;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenAdbModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  selectedDevice,
  devices,
  adbPath,
  adbVersion,
  darkMode,
  setDarkMode,
  onOpenAdbModal
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 transition-colors">
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm shadow-blue-500/20">
              <img src="/FP2.png" alt="FP" className="w-6 h-6 object-contain" onError={(e) => {
                // Fallback if image fails
                (e.target as HTMLElement).style.display = 'none';
              }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                  FunnelPeek <span className="text-blue-500 text-xs px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 font-semibold border border-blue-200 dark:border-blue-900">NEXT 2.0</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Android UI Hierarchy & Flow Inspector</p>
            </div>
          </div>
        </div>

        {/* Center / Right Status badges */}
        <div className="flex items-center space-x-3">
          {/* ADB Path status badge */}
          <button
            onClick={onOpenAdbModal}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
            title="Click to configure or view ADB binary path"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {adbPath ? adbPath.split('\\').pop() : 'ADB Not Configured'}
            </span>
            {adbVersion && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="ADB Connected" />
            )}
          </button>

          {/* Active Device Badge */}
          {selectedDevice && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">
                {devices.find(d => d.id === selectedDevice)?.model || selectedDevice}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
