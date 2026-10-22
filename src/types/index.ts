export interface UIElementProperties {
  isFocusable: boolean;
  isClickable: boolean;
  isEnabled: boolean;
  isSelected: boolean;
  isChecked: boolean;
  isScrollable: boolean;
  isCheckable: boolean;
  isLongClickable: boolean;
  isPassword: boolean;
}

export interface UIElement {
  id: string;
  index: number;
  originalIndex: string;
  tagName: string;
  className: string;
  package: string;
  text: string;
  contentDesc: string;
  resourceId: string;
  bounds: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  depth: number;
  properties: UIElementProperties;
  children: UIElement[];
  parent?: UIElement | null;
  lastClickTime?: number;
}

export interface Device {
  id: string;
  model?: string;
  state: string;
}

export interface DetectedAdb {
  path: string;
  source: 'path' | 'android-sdk' | 'c-adb' | 'custom';
  version?: string;
}

export interface FunnelStep {
  id: string;
  title: string;
  timestamp: string;
  screenshot: string;
  xml: string;
  selectedElement?: UIElement | null;
  actionTaken?: string;
  notes?: string;
}

export interface PackageInfo {
  packageName: string;
  displayName: string;
  version: string;
}

export interface ElectronAPI {
  platform: string;
  getAppVersion: () => Promise<string>;
  autoDetectAdb: () => Promise<DetectedAdb[]>;
  selectAdbFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  setAdbPath: (path: string) => Promise<{ success: boolean; version?: string }>;
  getAdbVersion: () => Promise<string>;
  adbGetDevices: () => Promise<Device[]>;
  adbPullScreenshot: (deviceId: string) => Promise<string>;
  adbDumpUi: (deviceId: string) => Promise<string>;
  adbInputTap: (deviceId: string, x: number, y: number) => Promise<{ success: boolean }>;
  adbInputText: (deviceId: string, text: string) => Promise<{ success: boolean }>;
  adbInputKeyEvent: (deviceId: string, keycode: string) => Promise<{ success: boolean }>;
  adbListPackages: (deviceId: string, options?: any) => Promise<PackageInfo[]>;
  adbUninstallPackage: (deviceId: string, packageName: string) => Promise<{ success: boolean }>;
  adbInstallPackage: (deviceId: string) => Promise<{ canceled?: boolean; success?: boolean; apkPath?: string }>;
  saveFunnelZip: (data: any) => Promise<{ canceled?: boolean; success?: boolean; filePath?: string }>;
  loadFunnelZip: () => Promise<{ canceled?: boolean; success?: boolean; data?: any; filePath?: string }>;
  minimizeWindow?: () => Promise<void>;
  maximizeWindow?: () => Promise<void>;
  closeWindow?: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
