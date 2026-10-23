import React, { useState, useEffect } from 'react';
import { Package, Trash2, Upload, Search, RefreshCw, Smartphone, CheckSquare, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Device, PackageInfo } from '../types/index.ts';

interface ManagePackagesProps {
  devices: Device[];
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
}

export const ManagePackages: React.FC<ManagePackagesProps> = ({
  devices,
  selectedDevice,
  setSelectedDevice
}) => {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'thirdParty' | 'system'>('thirdParty');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPackages = async () => {
    if (!selectedDevice || !window.electronAPI) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const opts: any = {};
      if (filterType === 'thirdParty') opts.thirdPartyOnly = true;
      if (filterType === 'system') opts.systemOnly = true;

      const list = await window.electronAPI.adbListPackages(selectedDevice, opts);
      setPackages(list);
      setSelectedPackages(new Set());
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to list packages' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      loadPackages();
    }
  }, [selectedDevice, filterType]);

  const filteredPackages = packages.filter(p =>
    p.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectPackage = (pkgName: string) => {
    const next = new Set(selectedPackages);
    if (next.has(pkgName)) next.delete(pkgName);
    else next.add(pkgName);
    setSelectedPackages(next);
  };

  const selectAll = () => {
    if (selectedPackages.size === filteredPackages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(filteredPackages.map(p => p.packageName)));
    }
  };

  // Uninstall selected
  const handleUninstallSelected = async () => {
    if (!selectedDevice || selectedPackages.size === 0 || !window.electronAPI) return;
    if (!confirm(`Are you sure you want to uninstall ${selectedPackages.size} packages?`)) return;

    setIsActionInProgress(true);
    setStatusMessage(null);
    try {
      let count = 0;
      for (const pkg of Array.from(selectedPackages)) {
        await window.electronAPI.adbUninstallPackage(selectedDevice, pkg);
        count++;
      }
      setStatusMessage({ type: 'success', text: `Successfully uninstalled ${count} packages!` });
      loadPackages();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Uninstall failed' });
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Install APK
  const handleInstallApk = async () => {
    if (!selectedDevice || !window.electronAPI) return;
    setIsActionInProgress(true);
    setStatusMessage(null);
    try {
      const res = await window.electronAPI.adbInstallPackage(selectedDevice);
      if (!res.canceled && res.success) {
        setStatusMessage({ type: 'success', text: `Successfully installed APK: ${res.apkPath?.split('\\').pop()}` });
        loadPackages();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Install APK failed' });
    } finally {
      setIsActionInProgress(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-jb-panel rounded p-3 border border-slate-200 dark:border-jb-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Device selector */}
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-jb-accent" />
          <select
            value={selectedDevice || ''}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs font-medium py-1 px-2.5 rounded border border-slate-300 dark:border-jb-border bg-white dark:bg-jb-elevated text-slate-800 dark:text-jb-text focus:outline-none focus:ring-1 focus:ring-jb-accent"
          >
            {devices.length === 0 ? (
              <option value="">No Devices Connected</option>
            ) : (
              devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.model ? `${d.model} (${d.id})` : d.id}
                </option>
              ))
            )}
          </select>

          <button
            onClick={loadPackages}
            disabled={isLoading || !selectedDevice}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-textMuted transition-colors"
            title="Refresh packages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-jb-accent' : ''}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallApk}
            disabled={isActionInProgress || !selectedDevice}
            className="px-3.5 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-400 dark:disabled:bg-jb-elevated text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Install APK
          </button>

          {selectedPackages.size > 0 && (
            <button
              onClick={handleUninstallSelected}
              disabled={isActionInProgress}
              className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Uninstall ({selectedPackages.size})
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-jb-panel rounded p-3.5 border border-slate-200 dark:border-jb-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-jb-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package name (e.g. com.whatsapp)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-jb-elevated border border-slate-200 dark:border-jb-border rounded text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-jb-bg p-0.5 rounded text-xs">
            <button
              onClick={() => setFilterType('thirdParty')}
              className={`px-3 py-1 rounded transition-colors ${filterType === 'thirdParty' ? 'bg-white dark:bg-jb-elevated text-blue-600 dark:text-jb-text shadow-xs font-semibold' : 'text-slate-500 dark:text-jb-textMuted hover:text-slate-900 dark:hover:text-jb-text'}`}
            >
              User Apps (3rd-Party)
            </button>
            <button
              onClick={() => setFilterType('system')}
              className={`px-3 py-1 rounded transition-colors ${filterType === 'system' ? 'bg-white dark:bg-jb-elevated text-blue-600 dark:text-jb-text shadow-xs font-semibold' : 'text-slate-500 dark:text-jb-textMuted hover:text-slate-900 dark:hover:text-jb-text'}`}
            >
              System Apps
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded transition-colors ${filterType === 'all' ? 'bg-white dark:bg-jb-elevated text-blue-600 dark:text-jb-text shadow-xs font-semibold' : 'text-slate-500 dark:text-jb-textMuted hover:text-slate-900 dark:hover:text-jb-text'}`}
            >
              All Packages
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`p-2.5 rounded text-xs font-medium flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-[#1E3326] text-emerald-800 dark:text-jb-success border-emerald-200 dark:border-[#2B543A]'
              : 'bg-rose-50 dark:bg-[#351E20] text-rose-800 dark:text-jb-error border-rose-200 dark:border-[#52282C]'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Table / List */}
        <div className="border border-slate-200 dark:border-jb-border rounded overflow-hidden">
          <div className="bg-slate-50 dark:bg-jb-elevated/40 px-3.5 py-2 border-b border-slate-200 dark:border-jb-border flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-jb-text">
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="p-1 hover:text-jb-accent transition-colors">
                {selectedPackages.size > 0 && selectedPackages.size === filteredPackages.length ? (
                  <CheckSquare className="w-4 h-4 text-jb-accent" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 dark:text-jb-textMuted" />
                )}
              </button>
              <span>Package Name ({filteredPackages.length})</span>
            </div>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-jb-border/60 max-h-[500px] overflow-y-auto">
            {filteredPackages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-jb-textMuted text-xs">
                {isLoading ? 'Scanning packages from device...' : 'No packages found matching filter.'}
              </div>
            ) : (
              filteredPackages.map(pkg => {
                const isSelected = selectedPackages.has(pkg.packageName);

                return (
                  <div
                    key={pkg.packageName}
                    className={`px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-jb-hover transition-colors text-xs ${
                      isSelected ? 'bg-blue-50/60 dark:bg-jb-accentHover/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleSelectPackage(pkg.packageName)}
                        className="text-slate-400 dark:text-jb-textMuted hover:text-jb-accent transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-jb-accent" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span className="font-mono text-slate-900 dark:text-jb-text font-medium truncate block">
                          {pkg.packageName}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-jb-textMuted">
                          App: {pkg.displayName}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (!selectedDevice || !window.electronAPI) return;
                        if (confirm(`Uninstall ${pkg.packageName}?`)) {
                          try {
                            await window.electronAPI.adbUninstallPackage(selectedDevice, pkg.packageName);
                            loadPackages();
                          } catch (e: any) {
                            alert(e.message);
                          }
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#351E20] transition-colors"
                      title="Uninstall app"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
