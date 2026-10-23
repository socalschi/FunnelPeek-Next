import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { FunnelBoard } from './components/FunnelBoard.tsx';
import { FunnelFlow } from './components/FunnelFlow.tsx';
import { ManagePackages } from './components/ManagePackages.tsx';
import { About } from './components/About.tsx';
import { AdbConfigModal } from './components/AdbConfigModal.tsx';
import { Device, DetectedAdb, FunnelStep } from './types/index.ts';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('funnelboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // ADB & Device state
  const [adbPath, setAdbPath] = useState<string | null>(null);
  const [adbVersion, setAdbVersion] = useState<string | null>(null);
  const [detectedAdbs, setDetectedAdbs] = useState<DetectedAdb[]>([]);
  const [isAdbModalOpen, setIsAdbModalOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Funnel Flow sequence state
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [isCapturingStep, setIsCapturingStep] = useState(false);

  // Sync Dark Mode class with HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Auto-detect ADB & Devices
  const scanAdbAndDevices = async () => {
    if (!window.electronAPI) return;

    try {
      // 1. Detect ADB binaries
      const detected = await window.electronAPI.autoDetectAdb();
      setDetectedAdbs(detected);

      if (detected.length > 0) {
        setAdbPath(detected[0].path);
        // Initialize with first detected ADB
        await window.electronAPI.setAdbPath(detected[0].path);
        const ver = await window.electronAPI.getAdbVersion();
        setAdbVersion(ver);
      }

      // 2. Fetch connected devices
      await refreshDevices();
    } catch (err) {
      console.warn('Initial scan notice:', err);
    }
  };

  const refreshDevices = async () => {
    if (!window.electronAPI) return;
    try {
      const devList = await window.electronAPI.adbGetDevices();
      setDevices(devList);
      if (devList.length === 0) {
        setSelectedDevice(null);
      } else if (!selectedDevice || !devList.some(d => d.id === selectedDevice)) {
        setSelectedDevice(devList[0].id);
      }
    } catch (err) {
      console.warn('Refresh devices notice:', err);
      setDevices([]);
      setSelectedDevice(null);
    }
  };

  useEffect(() => {
    scanAdbAndDevices();

    // Poll devices every 3 seconds to seamlessly detect USB connect/disconnect
    const interval = setInterval(() => {
      refreshDevices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle manual/detected ADB selection
  const handleSelectAdbPath = async (path: string) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.setAdbPath(path);
      setAdbPath(path);
      const ver = await window.electronAPI.getAdbVersion();
      setAdbVersion(ver);
      await refreshDevices();
      setIsAdbModalOpen(false);
    } catch (err: any) {
      alert(`Failed to set ADB path: ${err.message}`);
    }
  };

  // Capture step for Funnel Flow
  const handleCaptureFunnelStep = async () => {
    if (!selectedDevice || !window.electronAPI) return;
    setIsCapturingStep(true);
    try {
      const screenshot = await window.electronAPI.adbPullScreenshot(selectedDevice);
      const xml = await window.electronAPI.adbDumpUi(selectedDevice);

      const step: FunnelStep = {
        id: `step_${Date.now()}`,
        title: `Step ${funnelSteps.length + 1} (${new Date().toLocaleTimeString()})`,
        timestamp: new Date().toISOString(),
        screenshot,
        xml
      };

      setFunnelSteps(prev => [...prev, step]);
    } catch (err: any) {
      alert(`Capture step failed: ${err.message}`);
    } finally {
      setIsCapturingStep(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedDevice={selectedDevice}
        devices={devices}
        adbPath={adbPath}
        adbVersion={adbVersion}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAdbModal={() => setIsAdbModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          appVersion="2.0.0"
        />

        <main className="flex-1 p-4 overflow-y-auto">
          {currentPage === 'funnelboard' && (
            <FunnelBoard
              devices={devices}
              selectedDevice={selectedDevice}
              setSelectedDevice={setSelectedDevice}
              onRefreshDevices={refreshDevices}
              onAddToFunnel={(step) => setFunnelSteps(prev => [...prev, step])}
            />
          )}

          {currentPage === 'funnelflow' && (
            <FunnelFlow
              steps={funnelSteps}
              setSteps={setFunnelSteps}
              selectedDevice={selectedDevice}
              onCaptureStep={handleCaptureFunnelStep}
              isCapturing={isCapturingStep}
            />
          )}

          {currentPage === 'packages' && (
            <ManagePackages
              devices={devices}
              selectedDevice={selectedDevice}
              setSelectedDevice={setSelectedDevice}
            />
          )}

          {currentPage === 'about' && (
            <About
              appVersion="2.0.0"
              adbVersion={adbVersion}
              platform={window.electronAPI?.platform || 'windows'}
            />
          )}
        </main>
      </div>

      <AdbConfigModal
        isOpen={isAdbModalOpen}
        onClose={() => setIsAdbModalOpen(false)}
        currentAdbPath={adbPath}
        detectedAdbs={detectedAdbs}
        onSelectAdb={handleSelectAdbPath}
        onRefreshDetected={scanAdbAndDevices}
      />
    </div>
  );
}

export default App;
