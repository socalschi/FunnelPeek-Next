import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform === 'win32'
    ? `Windows (${process.arch === 'x64' ? '64-bit' : process.arch})`
    : `${process.platform} (${process.arch})`,
  arch: process.arch,
  getAppVersion: () => ipcRenderer.invoke('get-version'),

  // ADB Auto-detect & Configuration
  autoDetectAdb: () => ipcRenderer.invoke('auto-detect-adb'),
  selectAdbFile: () => ipcRenderer.invoke('select-adb-file'),
  setAdbPath: (adbPath: string) => ipcRenderer.invoke('set-adb-path', adbPath),
  getAdbVersion: () => ipcRenderer.invoke('adb-version'),

  // Devices & Capture
  adbGetDevices: () => ipcRenderer.invoke('adb-get-devices'),
  adbPullScreenshot: (deviceId: string) => ipcRenderer.invoke('adb-pull-screenshot', deviceId),
  adbDumpUi: (deviceId: string) => ipcRenderer.invoke('adb-dump-pagesource', deviceId),

  // Remote Input
  adbInputTap: (deviceId: string, x: number, y: number) => ipcRenderer.invoke('adb-input-tap', deviceId, x, y),
  adbInputText: (deviceId: string, text: string) => ipcRenderer.invoke('adb-input-text', deviceId, text),
  adbInputKeyEvent: (deviceId: string, keycode: string) => ipcRenderer.invoke('adb-input-keyevent', deviceId, keycode),

  // Packages
  adbListPackages: (deviceId: string, options?: any) => ipcRenderer.invoke('adb-list-packages', deviceId, options),
  adbUninstallPackage: (deviceId: string, packageName: string) => ipcRenderer.invoke('adb-uninstall-package', deviceId, packageName),
  adbInstallPackage: (deviceId: string) => ipcRenderer.invoke('adb-install-package', deviceId),

  // Zip Archive Operations
  saveFunnelZip: (data: any) => ipcRenderer.invoke('save-funnel-zip', data),
  loadFunnelZip: () => ipcRenderer.invoke('load-funnel-zip'),

  // Funnel Flow Persistence across app restarts
  saveFlowState: (steps: any[]) => ipcRenderer.invoke('save-flow-state', steps),
  loadFlowState: () => ipcRenderer.invoke('load-flow-state'),
  clearFlowState: () => ipcRenderer.invoke('clear-flow-state'),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window')
});
