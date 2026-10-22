import React, { useState, useEffect, useMemo } from 'react';
import { Camera, RefreshCw, Smartphone, Download, Upload, Plus, AlertCircle, ShieldAlert } from 'lucide-react';
import { Device, UIElement, FunnelStep } from '../types/index.ts';
import { parseHierarchyXml, filterElements, searchByXPath } from '../utils/xmlParser.ts';
import { CanvasImageRenderer } from './CanvasImageRenderer.tsx';
import { ElementTree } from './ElementTree.tsx';
import { ElementDetailsModal } from './ElementDetailsModal.tsx';

interface FunnelBoardProps {
  devices: Device[];
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
  onRefreshDevices: () => Promise<void>;
  onAddToFunnel?: (step: FunnelStep) => void;
}

export const FunnelBoard: React.FC<FunnelBoardProps> = ({
  devices,
  selectedDevice,
  setSelectedDevice,
  onRefreshDevices,
  onAddToFunnel
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uiHierarchyXml, setUiHierarchyXml] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSecuredScreen, setIsSecuredScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selection & Highlight state
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'xpath'>('text');

  // Canvas display options
  const [showAllRectangles, setShowAllRectangles] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Parse XML into tree & flat list
  const { rootElements, allElements } = useMemo(() => {
    return parseHierarchyXml(uiHierarchyXml);
  }, [uiHierarchyXml]);

  // Filtered elements for search
  const filteredElements = useMemo(() => {
    if (!searchQuery.trim()) return [];
    if (searchMode === 'xpath') {
      return searchByXPath(uiHierarchyXml, searchQuery, allElements);
    }
    return filterElements(allElements, searchQuery);
  }, [searchQuery, searchMode, uiHierarchyXml, allElements]);

  // Selected element reference
  const selectedElement = useMemo(() => {
    return allElements.find(el => el.id === selectedElementId) || null;
  }, [allElements, selectedElementId]);

  // Perform screen capture & hierarchy dump
  const handleCapture = async () => {
    if (!selectedDevice || !window.electronAPI) return;
    setIsCapturing(true);
    setErrorMessage(null);
    setIsSecuredScreen(false);

    try {
      // 1. Capture screen
      const screenshot = await window.electronAPI.adbPullScreenshot(selectedDevice);
      setCapturedImage(screenshot);

      // 2. Dump UI hierarchy
      const xml = await window.electronAPI.adbDumpUi(selectedDevice);
      setUiHierarchyXml(xml);

      // Reset selection
      setSelectedElementId(null);
      setHighlightedElementId(null);
    } catch (err: any) {
      console.error('Capture failed:', err);
      if (err.message && err.message.includes('blank') || err.message.includes('secured')) {
        setIsSecuredScreen(true);
      }
      setErrorMessage(err.message || 'Capture failed');
    } finally {
      setIsCapturing(false);
    }
  };

  // Save capture as ZIP
  const handleSaveZip = async () => {
    if (!capturedImage || !uiHierarchyXml || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.saveFunnelZip({
        imageData: capturedImage,
        xmlData: uiHierarchyXml,
        deviceId: selectedDevice || 'device'
      });
      if (res.success) {
        alert('Capture ZIP saved successfully!');
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  // Load capture from ZIP
  const handleLoadZip = async () => {
    if (!window.electronAPI) return;
    try {
      const res = await window.electronAPI.loadFunnelZip();
      if (res.success && res.data) {
        setCapturedImage(res.data.imageData);
        setUiHierarchyXml(res.data.xmlData);
        setSelectedElementId(null);
        setHighlightedElementId(null);
      }
    } catch (err: any) {
      alert(`Load failed: ${err.message}`);
    }
  };

  // Add current screen to Funnel Sequence
  const handleAddCurrentToFunnel = () => {
    if (!capturedImage || !uiHierarchyXml || !onAddToFunnel) return;
    const step: FunnelStep = {
      id: `step_${Date.now()}`,
      title: `Screen ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString(),
      screenshot: capturedImage,
      xml: uiHierarchyXml,
      selectedElement: selectedElement
    };
    onAddToFunnel(step);
    alert('Screen added to Funnel Flow sequence!');
  };

  return (
    <div className="space-y-3 h-[calc(100vh-100px)] flex flex-col">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Device selector */}
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-500" />
          <select
            value={selectedDevice || ''}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onClick={onRefreshDevices}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Refresh device list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Capture & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCapture}
            disabled={isCapturing || !selectedDevice}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Camera className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? 'Capturing...' : 'Capture Screen'}
          </button>

          {capturedImage && onAddToFunnel && (
            <button
              onClick={handleAddCurrentToFunnel}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-colors"
              title="Add current screen to multi-step funnel"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Funnel
            </button>
          )}

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={handleSaveZip}
            disabled={!capturedImage}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
            title="Save capture as .zip"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleLoadZip}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Load capture from .zip"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security alert if screen is black/secured */}
      {isSecuredScreen && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Screen appears black/secured (app likely uses FLAG_SECURE). XML hierarchy is still inspected!</span>
        </div>
      )}

      {/* Main Split Area (Canvas on Left, Tree on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Canvas Section */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <CanvasImageRenderer
            base64Image={capturedImage}
            elements={allElements}
            highlightedElementId={highlightedElementId}
            selectedElementId={selectedElementId}
            showAllRectangles={showAllRectangles}
            setShowAllRectangles={setShowAllRectangles}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            onElementHover={setHighlightedElementId}
            onElementClick={(id) => {
              setSelectedElementId(id);
              if (id) setIsDetailsModalOpen(true);
            }}
            onElementDoubleClick={(id) => {
              setSelectedElementId(id);
              setIsDetailsModalOpen(true);
            }}
          />
        </div>

        {/* Hierarchy Tree Section */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-0">
          <ElementTree
            rootElements={rootElements}
            filteredElements={filteredElements}
            isSearching={Boolean(searchQuery.trim())}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            highlightedElementId={highlightedElementId}
            selectedElementId={selectedElementId}
            onElementHover={setHighlightedElementId}
            onElementSelect={setSelectedElementId}
            onElementDoubleClick={(id) => {
              setSelectedElementId(id);
              setIsDetailsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Details & Actions Modal */}
      {isDetailsModalOpen && selectedElement && (
        <ElementDetailsModal
          element={selectedElement}
          deviceId={selectedDevice}
          onClose={() => setIsDetailsModalOpen(false)}
          onRefreshAfterAction={handleCapture}
        />
      )}
    </div>
  );
};
