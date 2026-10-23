import React from 'react';
import { Menu, RefreshCw, ScanEye, Download, Upload, Check } from 'lucide-react';
import { Device } from '../types/index.ts';

export const AndroidPhoneIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Android phone chassis with slight rounded corners */}
    <rect x="5.5" y="2" width="13" height="20" rx="2.5" ry="2.5" />
    {/* Top speaker slit */}
    <line x1="10.5" y1="4.2" x2="13.5" y2="4.2" strokeWidth="1.4" />
    {/* Android camera hole punch */}
    <circle cx="12" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    {/* Screen bezel lines */}
    <line x1="7" y1="5.6" x2="17" y2="5.6" strokeWidth="0.8" opacity="0.3" />
    <line x1="7" y1="18.5" x2="17" y2="18.5" strokeWidth="0.8" opacity="0.3" />
    {/* Android navigation pill bar at the bottom */}
    <line x1="9.5" y1="20" x2="14.5" y2="20" strokeWidth="1.6" />
  </svg>
);

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
  devices: Device[];
  onRefreshDevices: () => Promise<void>;
  onInspect: () => Promise<void>;
  isCapturing: boolean;
  hasCapturedImage: boolean;
  onAddToFlow?: () => void;
  justAddedToFlow?: boolean;
  onLoadZip: () => Promise<void>;
  onSaveZip: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  selectedDevice,
  setSelectedDevice,
  devices,
  onRefreshDevices,
  onInspect,
  isCapturing,
  hasCapturedImage,
  onAddToFlow,
  justAddedToFlow,
  onLoadZip,
  onSaveZip
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-jb-border bg-white dark:bg-jb-panel sticky top-0 z-30 transition-colors shrink-0">
      <div className="px-3.5 py-1.5 flex items-center justify-between gap-3">
        {/* Left: Menu Toggle + App Brand */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-jb-accent/15 border border-jb-accent/30 flex items-center justify-center shadow-xs overflow-hidden">
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
                <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-blue-50 dark:bg-jb-hover text-jb-accent border border-blue-200 dark:border-jb-border">
                  NEXT 2.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Bar (Device selector, Refresh, Inspect Screen, Add to Flow, Load Zip, Save Zip) */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0 overflow-x-auto">
          {/* Device Selector with Android Phone Icon and Refresh to its immediate right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AndroidPhoneIcon className="w-5 h-5 text-jb-accent shrink-0" />

            {/* Refresh moved to the left, immediately to the right of the phone icon */}
            <button
              onClick={onRefreshDevices}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-textMuted hover:text-jb-accent transition-colors shrink-0"
              title="Atualizar lista de aparelhos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <select
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="text-xs font-medium py-1 px-2.5 rounded border border-slate-300 dark:border-jb-border bg-white dark:bg-jb-elevated text-slate-800 dark:text-jb-text focus:outline-none focus:ring-1 focus:ring-jb-accent max-w-[200px] truncate"
            >
              {devices.length === 0 ? (
                <option value="">Nenhum Aparelho Conectado</option>
              ) : (
                devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.model ? `${d.model} (${d.id})` : d.id}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-jb-border mx-0.5" />

          {/* Inspect Screen Button */}
          <button
            onClick={onInspect}
            disabled={isCapturing || !selectedDevice}
            className="px-3 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-300 dark:disabled:bg-jb-elevated disabled:text-slate-500 dark:disabled:text-jb-textMuted text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            title="Inspecionar e analisar toda a estrutura da tela atual"
          >
            <ScanEye className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            <span>{isCapturing ? 'Analisando...' : 'Inspect Screen'}</span>
          </button>

          {/* Add to Flow Button */}
          {hasCapturedImage && onAddToFlow && (
            <button
              onClick={onAddToFlow}
              className={`px-3 py-1.5 rounded font-medium text-xs flex items-center gap-1.5 border transition-all shrink-0 ${
                justAddedToFlow
                  ? 'bg-jb-success text-white border-jb-success'
                  : 'bg-slate-50 dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-800 dark:text-jb-text border-slate-300 dark:border-jb-border'
              }`}
              title="Salvar estrutura completa no Funnel Flow para análise posterior"
            >
              {justAddedToFlow && <Check className="w-3.5 h-3.5 text-white" />}
              <span>{justAddedToFlow ? 'Salvo no Flow!' : 'Add to Flow'}</span>
            </button>
          )}

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-jb-border mx-0.5" />

          {/* Download Icon: Carregar pacote .zip existente */}
          <button
            onClick={onLoadZip}
            className="p-1.5 rounded border border-slate-200 dark:border-jb-border hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text transition-colors shrink-0"
            title="Carregar pacote .zip existente"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Upload Icon: Salvar inspeção como pacote .zip */}
          <button
            onClick={onSaveZip}
            disabled={!hasCapturedImage}
            className="p-1.5 rounded border border-slate-200 dark:border-jb-border hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text disabled:opacity-40 transition-colors shrink-0"
            title="Salvar inspeção como pacote .zip"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
