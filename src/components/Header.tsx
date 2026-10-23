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
    <header className="border-b border-slate-200 dark:border-jb-border bg-white dark:bg-jb-panel sticky top-0 z-30 transition-colors">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-jb-accent flex items-center justify-center shadow-xs">
              <img
                src="/FP2.png"
                alt="FP"
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-slate-900 dark:text-jb-text tracking-tight leading-none">
                  FunnelPeek
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-50 dark:bg-jb-hover text-jb-accent border border-blue-200 dark:border-jb-border">
                  NEXT 2.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Status badges */}
        <div className="flex items-center space-x-2">
          {/* ADB Path status badge */}
          <button
            onClick={onOpenAdbModal}
            className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 dark:border-jb-border bg-slate-50 dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover text-xs transition-colors"
            title="Click to configure or view ADB binary path"
          >
            <Terminal className="w-3.5 h-3.5 text-jb-accent" />
            <span className="font-mono text-slate-700 dark:text-jb-text truncate max-w-[200px] text-[11px]">
              {adbPath ? adbPath.split('\\').pop() : 'ADB Not Configured'}
            </span>
            {adbVersion && (
              <span className="w-1.5 h-1.5 rounded-full bg-jb-success" title="ADB Connected" />
            )}
          </button>

          {/* Active Device Badge */}
          {selectedDevice && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-[#1E3326] border border-emerald-200 dark:border-[#2B543A] text-[11px] text-emerald-800 dark:text-jb-success">
              <Smartphone className="w-3 h-3 text-emerald-600 dark:text-jb-success" />
              <span className="font-medium">
                {devices.find(d => d.id === selectedDevice)?.model || selectedDevice}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-jb-success animate-pulse" />
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-jb-warning" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
