import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adbService } from './adb-service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Catch and suppress transient TCP socket reset errors (e.g. adb server restart / device disconnect)
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'ECONNRESET' || err?.message?.includes('ECONNRESET')) {
    console.warn('Ignored transient TCP socket reset (ECONNRESET)');
    return;
  }
  console.error('Uncaught Exception in Main Process:', err);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'ECONNRESET' || reason?.message?.includes('ECONNRESET')) {
    console.warn('Ignored transient unhandled rejection (ECONNRESET)');
    return;
  }
  console.error('Unhandled Rejection in Main Process:', reason);
});

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.cjs'))
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.js');

  let appIcon = 'H:\\Sistema\\Desktop\\FunnelPeek next.ico';
  if (!fs.existsSync(appIcon)) {
    appIcon = path.join(process.env.VITE_PUBLIC || path.join(__dirname, '../public'), 'icon.ico');
  }
  if (!fs.existsSync(appIcon)) {
    appIcon = path.join(process.env.VITE_PUBLIC || path.join(__dirname, '../public'), 'FP2.png');
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    },
    icon: appIcon,
    show: false,
    backgroundColor: '#1E1F22',
    titleBarStyle: 'default',
    title: 'FunnelPeek Next'
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Menu configuration
  Menu.setApplicationMenu(null);

  // Try auto-detecting ADB silently on start
  try {
    const detected = await adbService.autoDetectAdb();
    if (detected.length > 0) {
      await adbService.initialize(detected[0].path);
      console.log(`Auto-initialized ADB from: ${detected[0].path}`);
    }
  } catch (err) {
    console.warn('Initial ADB auto-detection notice:', err);
  }

  // IPC Handlers
  ipcMain.handle('get-version', () => '2.0.0');

  // Auto-detect ADB
  ipcMain.handle('auto-detect-adb', async () => {
    try {
      const detected = await adbService.autoDetectAdb();
      return detected;
    } catch (err: any) {
      return [];
    }
  });

  // Select ADB executable
  ipcMain.handle('select-adb-file', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow() || mainWindow || undefined;
      const result = await dialog.showOpenDialog(win as any, {
        title: 'Select ADB Executable',
        properties: ['openFile', 'dontAddToRecent'],
        filters: process.platform === 'win32'
          ? [
              { name: 'ADB Executable (adb.exe)', extensions: ['exe'] },
              { name: 'All Files (*.*)', extensions: ['*'] }
            ]
          : [{ name: 'All Files', extensions: ['*'] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
      }

      return { canceled: false, filePath: result.filePaths[0] };
    } catch (err: any) {
      console.error('Error opening file dialog:', err);
      throw err;
    }
  });

  // Set ADB path
  ipcMain.handle('set-adb-path', async (_event, adbPath: string) => {
    await adbService.initialize(adbPath);
    const version = await adbService.getVersion();
    return { success: true, version };
  });

  // Get ADB version
  ipcMain.handle('adb-version', async () => {
    return await adbService.getVersion();
  });

  // Get devices
  ipcMain.handle('adb-get-devices', async () => {
    return await adbService.listDevices();
  });

  // Pull screenshot
  ipcMain.handle('adb-pull-screenshot', async (_event, deviceId: string) => {
    return await adbService.captureScreenshot(deviceId);
  });

  // Dump UI hierarchy
  ipcMain.handle('adb-dump-pagesource', async (_event, deviceId: string) => {
    return await adbService.dumpUiHierarchy(deviceId);
  });

  // Remote Input Tap
  ipcMain.handle('adb-input-tap', async (_event, deviceId: string, x: number, y: number) => {
    await adbService.inputTap(deviceId, x, y);
    return { success: true };
  });

  // Remote Input Text
  ipcMain.handle('adb-input-text', async (_event, deviceId: string, text: string) => {
    await adbService.inputText(deviceId, text);
    return { success: true };
  });

  // Remote Input Keyevent
  ipcMain.handle('adb-input-keyevent', async (_event, deviceId: string, keycode: string) => {
    await adbService.inputKeyEvent(deviceId, keycode);
    return { success: true };
  });

  // Packages
  ipcMain.handle('adb-list-packages', async (_event, deviceId: string, options: any) => {
    return await adbService.listPackages(deviceId, options);
  });

  ipcMain.handle('adb-uninstall-package', async (_event, deviceId: string, packageName: string) => {
    await adbService.uninstallPackage(deviceId, packageName);
    return { success: true };
  });

  ipcMain.handle('adb-install-package', async (_event, deviceId: string) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select APK to Install',
      filters: [{ name: 'Android Package', extensions: ['apk'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const apkPath = result.filePaths[0];
    await adbService.installPackage(deviceId, apkPath);
    return { success: true, apkPath };
  });

  // Save Zip
  ipcMain.handle('save-funnel-zip', async (_event, data: any) => {
    if (!mainWindow) return { canceled: true };
    const defaultName = `funnel_${data.deviceId || 'device'}_${Date.now()}.zip`;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save FunnelPeek Archive (.zip)',
      defaultPath: defaultName,
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    await adbService.saveZip(result.filePath, data);
    return { success: true, filePath: result.filePath };
  });

  // Load Zip
  ipcMain.handle('load-funnel-zip', async () => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Load FunnelPeek Archive (.zip)',
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const data = await adbService.loadZip(result.filePaths[0]);
    return { success: true, data, filePath: result.filePaths[0] };
  });

  // Funnel Flow Persistent Storage across app restarts
  const flowStoragePath = path.join(app.getPath('userData'), 'funnel-flow-storage.json');

  ipcMain.handle('save-flow-state', async (_event, steps: any[]) => {
    try {
      const dir = path.dirname(flowStoragePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify(steps || [], null, 2);
      await fs.promises.writeFile(flowStoragePath, data, 'utf-8');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to save funnel flow state to disk:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-flow-state', async () => {
    try {
      if (!fs.existsSync(flowStoragePath)) {
        return { success: true, steps: [] };
      }
      const data = await fs.promises.readFile(flowStoragePath, 'utf-8');
      const steps = JSON.parse(data);
      return { success: true, steps: Array.isArray(steps) ? steps : [] };
    } catch (err: any) {
      console.error('Failed to load funnel flow state from disk:', err);
      return { success: false, steps: [], error: err.message };
    }
  });

  ipcMain.handle('clear-flow-state', async () => {
    try {
      if (fs.existsSync(flowStoragePath)) {
        await fs.promises.unlink(flowStoragePath);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to clear funnel flow state from disk:', err);
      return { success: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  adbService.close();
});
