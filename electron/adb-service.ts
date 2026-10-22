import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import adbkitPkg from '@devicefarmer/adbkit';
const Adb = (adbkitPkg as any).Adb || (adbkitPkg as any).default?.Adb || adbkitPkg;
import archiver from 'archiver';
import yauzl from 'yauzl';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface DetectedAdb {
  path: string;
  source: 'path' | 'android-sdk' | 'c-adb' | 'custom';
  version?: string;
}

export class AdbService {
  private adbClient: any = null;
  public currentAdbPath: string | null = null;

  /**
   * Automatically detect ADB binary on the host machine
   */
  async autoDetectAdb(): Promise<DetectedAdb[]> {
    const candidates: { path: string; source: DetectedAdb['source'] }[] = [];

    // 1. Check C:\ADB\adb.exe (popular standalone location)
    if (process.platform === 'win32' && fs.existsSync('C:\\ADB\\adb.exe')) {
      candidates.push({ path: 'C:\\ADB\\adb.exe', source: 'c-adb' });
    }

    // 2. Check local AppData Android SDK
    if (process.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) {
        const sdkAdb = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
        if (fs.existsSync(sdkAdb)) {
          candidates.push({ path: sdkAdb, source: 'android-sdk' });
        }
      }
    }

    // 3. Check ANDROID_HOME and ANDROID_SDK_ROOT
    const envSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (envSdk) {
      const adbBinary = process.platform === 'win32' ? 'adb.exe' : 'adb';
      const sdkPath = path.join(envSdk, 'platform-tools', adbBinary);
      if (fs.existsSync(sdkPath)) {
        candidates.push({ path: sdkPath, source: 'android-sdk' });
      }
    }

    // 4. Check system PATH
    try {
      const cmd = process.platform === 'win32' ? 'where.exe adb' : 'which adb';
      const { stdout } = await execAsync(cmd);
      const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (fs.existsSync(line) && !candidates.some(c => c.path.toLowerCase() === line.toLowerCase())) {
          candidates.push({ path: line, source: 'path' });
        }
      }
    } catch {
      // PATH check failed or not in PATH
    }

    // Verify candidates and get their versions
    const results: DetectedAdb[] = [];
    for (const cand of candidates) {
      try {
        const { stdout } = await execFileAsync(cand.path, ['version']);
        const versionMatch = stdout.match(/version\s+([\d.]+)/i);
        results.push({
          path: cand.path,
          source: cand.source,
          version: versionMatch ? versionMatch[1] : 'detected'
        });
      } catch {
        // Skip invalid binary
      }
    }

    return results;
  }

  /**
   * Initialize ADB client with a specific binary path
   */
  async initialize(adbPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(adbPath)) {
        throw new Error(`ADB executable not found at: ${adbPath}`);
      }

      if (this.adbClient) {
        try {
          this.adbClient.kill();
        } catch {}
      }

      process.env.ANDROID_ADB = adbPath;
      this.currentAdbPath = adbPath;

      this.adbClient = Adb.createClient({
        bin: adbPath,
        host: '127.0.0.1',
        port: 5037
      });

      return true;
    } catch (error: any) {
      console.error('Failed to initialize ADB client:', error);
      this.adbClient = null;
      throw error;
    }
  }

  /**
   * Close and cleanup client
   */
  close() {
    if (this.adbClient) {
      try {
        this.adbClient.kill();
      } catch {}
      this.adbClient = null;
    }
  }

  /**
   * Ensure ADB is configured or throw
   */
  private ensureClient() {
    if (!this.adbClient && !this.currentAdbPath) {
      throw new Error('ADB is not configured. Please select or auto-detect ADB.');
    }
  }

  /**
   * Execute ADB command directly using the executable
   */
  async execAdbCli(args: string[]): Promise<string> {
    const bin = this.currentAdbPath || 'adb';
    const { stdout } = await execFileAsync(bin, args, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  }

  /**
   * Execute shell command on device
   */
  async deviceShell(deviceId: string, command: string): Promise<string> {
    this.ensureClient();
    try {
      if (this.adbClient) {
        const outputStream = await this.adbClient.shell(deviceId, command);
        const buffer = await this.streamToBuffer(outputStream);
        return buffer.toString('utf8').trim();
      }
    } catch {
      // Fallback to CLI
    }

    return (await this.execAdbCli(['-s', deviceId, 'shell', command])).trim();
  }

  /**
   * Get ADB version
   */
  async getVersion(): Promise<string> {
    this.ensureClient();
    try {
      if (this.adbClient) {
        const version = await this.adbClient.version();
        return `Android Debug Bridge version 1.0.${version}`;
      }
    } catch {}

    const out = await this.execAdbCli(['version']);
    return out.trim();
  }

  /**
   * List connected devices with model info
   */
  async listDevices(): Promise<{ id: string; model?: string; state: string }[]> {
    this.ensureClient();
    try {
      const output = await this.execAdbCli(['devices', '-l']);
      const lines = output.trim().split(/\r?\n/).slice(1);
      const devices: { id: string; model?: string; state: string }[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/\s+/);
        const id = parts[0];
        const state = parts[1] || 'device';
        const modelMatch = line.match(/model:([^\s]+)/);
        const model = modelMatch ? modelMatch[1].replace(/_/g, ' ') : undefined;
        devices.push({ id, state, model });
      }

      return devices;
    } catch (err: any) {
      if (this.adbClient) {
        const rawDevices = await this.adbClient.listDevices();
        return rawDevices.map((d: any) => ({ id: d.id, state: d.type || 'device' }));
      }
      throw err;
    }
  }

  /**
   * Capture device screen as base64 PNG
   */
  async captureScreenshot(deviceId: string): Promise<string> {
    this.ensureClient();

    try {
      if (this.adbClient) {
        const devClient = typeof this.adbClient.getDevice === 'function'
          ? this.adbClient.getDevice(deviceId)
          : this.adbClient;
        if (devClient && typeof devClient.screencap === 'function') {
          const stream = await devClient.screencap();
          const buffer = await this.streamToBuffer(stream);
          if (buffer.length > 1000) {
            return buffer.toString('base64');
          }
        }
      }
    } catch (e: any) {
      // Fallback seamlessly to direct adb exec-out
    }

    // CLI fallback: screencap to temporary remote file or direct exec
    const bin = this.currentAdbPath || 'adb';
    return new Promise((resolve, reject) => {
      const child = execFile(bin, ['-s', deviceId, 'exec-out', 'screencap', '-p'], {
        encoding: 'buffer',
        maxBuffer: 50 * 1024 * 1024
      }, (error, stdout) => {
        if (error) {
          return reject(new Error(`Failed to capture screenshot: ${error.message}`));
        }
        if (!stdout || stdout.length < 100) {
          return reject(new Error('Captured screenshot is empty. The screen may be secured or turned off.'));
        }
        resolve(stdout.toString('base64'));
      });
    });
  }

  /**
   * Dump UI hierarchy XML from device
   */
  async dumpUiHierarchy(deviceId: string): Promise<string> {
    this.ensureClient();

    // 1. Run uiautomator dump
    const dumpOutput = await this.deviceShell(deviceId, 'uiautomator dump /sdcard/window_dump.xml');
    if (dumpOutput.includes('ERROR') || dumpOutput.includes('null root node')) {
      throw new Error(`Failed to dump UI hierarchy: ${dumpOutput}`);
    }

    // 2. Pull the file
    let xmlContent = '';
    try {
      if (this.adbClient) {
        const transfer = await this.adbClient.pull(deviceId, '/sdcard/window_dump.xml');
        const buffer = await this.streamToBuffer(transfer);
        xmlContent = buffer.toString('utf8');
      }
    } catch {
      // Fallback to cat
      xmlContent = await this.deviceShell(deviceId, 'cat /sdcard/window_dump.xml');
    }

    // 3. Clean up
    try {
      await this.deviceShell(deviceId, 'rm -f /sdcard/window_dump.xml');
    } catch {}

    if (!xmlContent || !xmlContent.includes('<hierarchy')) {
      throw new Error('Received invalid UI hierarchy XML');
    }

    return xmlContent;
  }

  /**
   * Send tap input
   */
  async inputTap(deviceId: string, x: number, y: number): Promise<void> {
    await this.deviceShell(deviceId, `input tap ${Math.round(x)} ${Math.round(y)}`);
  }

  /**
   * Send text input
   */
  async inputText(deviceId: string, text: string): Promise<void> {
    const escapedText = text
      .replace(/ /g, '%s')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/&/g, '\\&')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    await this.deviceShell(deviceId, `input text "${escapedText}"`);
  }

  /**
   * Send key event
   */
  async inputKeyEvent(deviceId: string, keycode: string): Promise<void> {
    await this.deviceShell(deviceId, `input keyevent ${keycode}`);
  }

  /**
   * List installed packages
   */
  async listPackages(deviceId: string, options: { thirdPartyOnly?: boolean; systemOnly?: boolean } = {}) {
    this.ensureClient();
    let command = 'pm list packages';
    if (options.thirdPartyOnly) command += ' -3';
    if (options.systemOnly) command += ' -s';

    const output = await this.deviceShell(deviceId, command);
    const packageNames = output
      .split(/\r?\n/)
      .filter(line => line.startsWith('package:'))
      .map(line => line.replace('package:', '').trim())
      .filter(Boolean);

    // Fetch version names with batching to avoid overwhelming the bridge
    const results = [];
    for (const pkg of packageNames) {
      results.push({
        packageName: pkg,
        displayName: pkg.split('.').pop() || pkg,
        version: 'Unknown'
      });
    }

    return results.sort((a, b) => a.packageName.localeCompare(b.packageName));
  }

  /**
   * Uninstall package
   */
  async uninstallPackage(deviceId: string, packageName: string): Promise<void> {
    const out = await this.deviceShell(deviceId, `pm uninstall ${packageName}`);
    if (!out.includes('Success')) {
      throw new Error(out || 'Uninstall failed');
    }
  }

  /**
   * Install APK
   */
  async installPackage(deviceId: string, apkPath: string): Promise<void> {
    const out = await this.execAdbCli(['-s', deviceId, 'install', '-r', apkPath]);
    if (!out.includes('Success')) {
      throw new Error(out || 'Installation failed');
    }
  }

  /**
   * Save capture to ZIP
   */
  async saveZip(savePath: string, data: { imageData: string; xmlData: string; deviceId: string; metadata?: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(savePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      // PNG
      const pngBuffer = Buffer.from(data.imageData, 'base64');
      archive.append(pngBuffer, { name: 'screenshot.png' });

      // XML
      archive.append(data.xmlData, { name: 'ui_hierarchy.xml' });

      // Metadata
      const meta = JSON.stringify({
        deviceId: data.deviceId,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        ...(data.metadata || {})
      }, null, 2);
      archive.append(meta, { name: 'metadata.json' });

      archive.finalize();
    });
  }

  /**
   * Load capture from ZIP
   */
  async loadZip(filePath: string): Promise<{ imageData: string; xmlData: string; metadata: any }> {
    return new Promise((resolve, reject) => {
      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) return reject(err || new Error('Could not open ZIP'));

        const files: { screenshot?: string; xml?: string; metadata?: any } = {};
        let entriesProcessed = 0;
        const totalEntries = zipfile.entryCount;

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry();
            return;
          }

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err || !readStream) return reject(err || new Error('Could not read zip entry'));

            const chunks: Buffer[] = [];
            readStream.on('data', chunk => chunks.push(chunk));
            readStream.on('end', () => {
              const buf = Buffer.concat(chunks);
              if (entry.fileName === 'screenshot.png') {
                files.screenshot = buf.toString('base64');
              } else if (entry.fileName === 'ui_hierarchy.xml') {
                files.xml = buf.toString('utf8');
              } else if (entry.fileName === 'metadata.json') {
                try {
                  files.metadata = JSON.parse(buf.toString('utf8'));
                } catch {
                  files.metadata = {};
                }
              }

              entriesProcessed++;
              if (entriesProcessed === totalEntries) {
                if (!files.screenshot || !files.xml) {
                  return reject(new Error('ZIP is missing screenshot.png or ui_hierarchy.xml'));
                }
                resolve({
                  imageData: files.screenshot,
                  xmlData: files.xml,
                  metadata: files.metadata || {}
                });
              } else {
                zipfile.readEntry();
              }
            });
          });
        });

        zipfile.on('error', reject);
      });
    });
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

export const adbService = new AdbService();
