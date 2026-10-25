import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { FunnelBoard } from './components/FunnelBoard.tsx';
import { FunnelFlow } from './components/FunnelFlow.tsx';
import { ManagePackages } from './components/ManagePackages.tsx';
import { About } from './components/About.tsx';
import { AdbConfigModal } from './components/AdbConfigModal.tsx';
import { Device, DetectedAdb, FunnelStep } from './types/index.ts';
import { parseHierarchyXml, extractActivePackage, formatBrazilianDateTime } from './utils/xmlParser.ts';

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

  // Persistent inspection state (retained across tab switching!)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uiHierarchyXml, setUiHierarchyXml] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSecuredScreen, setIsSecuredScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justAddedToFlow, setJustAddedToFlow] = useState(false);

  // Funnel Flow sequence state
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [isCapturingStep, setIsCapturingStep] = useState(false);
  const isFlowLoadedRef = useRef<boolean>(false);

  // 1. Initial Load of Persisted Funnel Flow State from Disk
  useEffect(() => {
    const loadSavedFlow = async () => {
      if (!window.electronAPI?.loadFlowState) {
        isFlowLoadedRef.current = true;
        return;
      }
      try {
        const res = await window.electronAPI.loadFlowState();
        if (res.success && Array.isArray(res.steps) && res.steps.length > 0) {
          const hydratedSteps: FunnelStep[] = res.steps.map((s: any) => {
            const { rootElements, allElements } = parseHierarchyXml(s.xml || '');
            return {
              id: s.id,
              title: s.title || s.packageName,
              packageName: s.packageName,
              timestamp: s.timestamp,
              formattedDate: s.formattedDate,
              screenshot: s.screenshot,
              xml: s.xml,
              notes: s.notes || '',
              allElements,
              rootElements,
              selectedElement: s.selectedElementId ? (allElements.find(e => e.id === s.selectedElementId) || null) : null
            };
          });
          setFunnelSteps(hydratedSteps);

          // If board is currently empty, pre-populate board with the latest saved flow step
          // so preview AND complete UI hierarchy structure are ready immediately!
          const latestStep = hydratedSteps[hydratedSteps.length - 1];
          if (latestStep) {
            setCapturedImage(prev => prev || latestStep.screenshot);
            setUiHierarchyXml(prev => prev || latestStep.xml);
          }
        }
      } catch (err) {
        console.warn('Failed to load persisted funnel flow:', err);
      } finally {
        isFlowLoadedRef.current = true;
      }
    };

    loadSavedFlow();
  }, []);

  // 2. Auto-Save Funnel Flow State to Disk across changes / app close
  useEffect(() => {
    if (!isFlowLoadedRef.current) return;
    if (!window.electronAPI?.saveFlowState) return;

    // Serialize cleanly without circular parent references
    const persistable = funnelSteps.map(s => ({
      id: s.id,
      title: s.title,
      packageName: s.packageName,
      timestamp: s.timestamp,
      formattedDate: s.formattedDate,
      screenshot: s.screenshot,
      xml: s.xml,
      notes: s.notes || '',
      selectedElementId: s.selectedElement?.id || null
    }));

    window.electronAPI.saveFlowState(persistable).catch(err => {
      console.error('Failed to auto-save flow state to disk:', err);
    });
  }, [funnelSteps]);

  // Sync Dark Mode class with HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-inspect reference on launch
  const hasAutoInspectedRef = useRef<boolean>(false);

  // Inspect device screen & hierarchy
  const handleInspect = async (deviceIdOverride?: string) => {
    const targetDev = deviceIdOverride || selectedDevice;
    if (!targetDev || !window.electronAPI) return;
    setIsCapturing(true);
    setErrorMessage(null);
    setIsSecuredScreen(false);

    try {
      const screenshot = await window.electronAPI.adbPullScreenshot(targetDev);
      setCapturedImage(screenshot);

      const xml = await window.electronAPI.adbDumpUi(targetDev);
      setUiHierarchyXml(xml);

      setSelectedElementId(null);
      setHighlightedElementId(null);
      setCurrentPage('funnelboard');
    } catch (err: any) {
      console.error('Inspection failed:', err);
      if (err.message && (err.message.includes('blank') || err.message.includes('secured'))) {
        setIsSecuredScreen(true);
      }
      setErrorMessage(err.message || 'Falha ao inspecionar tela do dispositivo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const refreshDevices = async (shouldAutoInspect = false) => {
    if (!window.electronAPI) return;
    try {
      const devList = await window.electronAPI.adbGetDevices();
      setDevices(devList);
      if (devList.length === 0) {
        setSelectedDevice(null);
      } else {
        const activeDev = selectedDevice && devList.some(d => d.id === selectedDevice)
          ? selectedDevice
          : devList[0].id;
        setSelectedDevice(activeDev);

        // Auto inspect upon initial ADB confirmation and device detection!
        if (shouldAutoInspect && !hasAutoInspectedRef.current && activeDev) {
          hasAutoInspectedRef.current = true;
          await handleInspect(activeDev);
        }
      }
    } catch (err) {
      console.warn('Refresh devices notice:', err);
      setDevices([]);
      setSelectedDevice(null);
    }
  };

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

      // 2. Fetch connected devices and auto-inspect on start
      await refreshDevices(true);
    } catch (err) {
      console.warn('Initial scan notice:', err);
    }
  };

  useEffect(() => {
    scanAdbAndDevices();

    // Poll devices every 3 seconds to seamlessly detect USB connect/disconnect
    const interval = setInterval(() => {
      // If user connects phone after launch and we haven't inspected yet, auto inspect
      refreshDevices(!hasAutoInspectedRef.current);
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
      await refreshDevices(!hasAutoInspectedRef.current);
      setIsAdbModalOpen(false);
    } catch (err: any) {
      alert(`Failed to set ADB path: ${err.message}`);
    }
  };

  // Inspect & Add to Funnel Flow directly
  const handleCaptureFunnelStep = async () => {
    if (!selectedDevice || !window.electronAPI) return;
    setIsCapturingStep(true);
    try {
      const screenshot = await window.electronAPI.adbPullScreenshot(selectedDevice);
      const xml = await window.electronAPI.adbDumpUi(selectedDevice);
      const { allElements, rootElements } = parseHierarchyXml(xml);
      const pkg = extractActivePackage(allElements);

      const step: FunnelStep = {
        id: `step_${Date.now()}`,
        title: pkg,
        packageName: pkg,
        timestamp: new Date().toISOString(),
        formattedDate: formatBrazilianDateTime(Date.now()),
        screenshot,
        xml,
        allElements,
        rootElements
      };

      setFunnelSteps(prev => [...prev, step]);

      // Also keep current inspection updated
      setCapturedImage(screenshot);
      setUiHierarchyXml(xml);
      setSelectedElementId(null);
      setHighlightedElementId(null);
    } catch (err: any) {
      alert(`Falha na inspeção da tela: ${err.message}`);
    } finally {
      setIsCapturingStep(false);
    }
  };

  // Save current capture as ZIP package
  const handleSaveZip = async () => {
    if (!capturedImage || !uiHierarchyXml || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.saveFunnelZip({
        imageData: capturedImage,
        xmlData: uiHierarchyXml,
        deviceId: selectedDevice || 'device'
      });
      if (res.success) {
        alert('Arquivo ZIP da captura salvo com sucesso!');
      }
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    }
  };

  // Load existing capture from ZIP package
  const handleLoadZip = async () => {
    if (!window.electronAPI) return;
    try {
      const res = await window.electronAPI.loadFunnelZip();
      if (res.success && res.data) {
        setCapturedImage(res.data.imageData);
        setUiHierarchyXml(res.data.xmlData);
        setSelectedElementId(null);
        setHighlightedElementId(null);
        setCurrentPage('funnelboard');
      }
    } catch (err: any) {
      alert(`Falha ao carregar ZIP: ${err.message}`);
    }
  };

  // Add current screen to Funnel Flow sequence
  const handleAddCurrentToFlow = () => {
    if (!capturedImage || !uiHierarchyXml) return;
    const { rootElements, allElements } = parseHierarchyXml(uiHierarchyXml);
    const pkg = extractActivePackage(allElements);
    const selectedEl = allElements.find(e => e.id === selectedElementId) || null;
    const step: FunnelStep = {
      id: `step_${Date.now()}`,
      title: pkg,
      packageName: pkg,
      timestamp: new Date().toISOString(),
      formattedDate: formatBrazilianDateTime(Date.now()),
      screenshot: capturedImage,
      xml: uiHierarchyXml,
      allElements,
      rootElements,
      selectedElement: selectedEl
    };
    setFunnelSteps(prev => [...prev, step]);
    setJustAddedToFlow(true);
    setTimeout(() => setJustAddedToFlow(false), 2000);
  };

  // Restore step structure into Funnel Board
  const handleRestoreToBoard = (step: FunnelStep) => {
    setCapturedImage(step.screenshot);
    setUiHierarchyXml(step.xml);
    setSelectedElementId(step.selectedElement?.id || null);
    setHighlightedElementId(null);
    setCurrentPage('funnelboard');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-jb-bg text-slate-900 dark:text-jb-text flex flex-col font-sans transition-colors">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        devices={devices}
        onRefreshDevices={() => refreshDevices(false)}
        onInspect={() => handleInspect()}
        isCapturing={isCapturing}
        hasCapturedImage={Boolean(capturedImage)}
        onAddToFlow={handleAddCurrentToFlow}
        justAddedToFlow={justAddedToFlow}
        onLoadZip={handleLoadZip}
        onSaveZip={handleSaveZip}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 min-w-0 relative">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          appVersion="2.0.0"
          adbPath={adbPath}
          adbVersion={adbVersion}
          onOpenAdbModal={() => setIsAdbModalOpen(true)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className="flex-1 p-2 overflow-hidden flex flex-col min-h-0 min-w-0">
          {currentPage === 'funnelboard' && (
            <FunnelBoard
              selectedDevice={selectedDevice}
              capturedImage={capturedImage}
              setCapturedImage={setCapturedImage}
              uiHierarchyXml={uiHierarchyXml}
              setUiHierarchyXml={setUiHierarchyXml}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              highlightedElementId={highlightedElementId}
              setHighlightedElementId={setHighlightedElementId}
              isSecuredScreen={isSecuredScreen}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              onInspect={() => handleInspect()}
            />
          )}

          {currentPage === 'funnelflow' && (
            <div className="flex-1 overflow-y-auto">
              <FunnelFlow
                steps={funnelSteps}
                setSteps={setFunnelSteps}
                selectedDevice={selectedDevice}
                onCaptureStep={handleCaptureFunnelStep}
                isCapturing={isCapturingStep}
                onRestoreToBoard={handleRestoreToBoard}
              />
            </div>
          )}

          {currentPage === 'packages' && (
            <div className="flex-1 overflow-y-auto">
              <ManagePackages
                devices={devices}
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
              />
            </div>
          )}

          {currentPage === 'about' && (
            <div className="flex-1 overflow-y-auto">
              <About
                appVersion="2.0.0"
                adbVersion={adbVersion}
                platform={window.electronAPI?.platform || 'Windows (64-bit)'}
              />
            </div>
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
