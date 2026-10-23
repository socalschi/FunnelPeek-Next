import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScanEye, RefreshCw, Smartphone, Download, Upload, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { Device, UIElement, FunnelStep } from '../types/index.ts';
import { parseHierarchyXml, filterElements, searchByXPath, extractActivePackage, formatBrazilianDateTime } from '../utils/xmlParser.ts';
import { CanvasImageRenderer } from './CanvasImageRenderer.tsx';
import { ElementTree } from './ElementTree.tsx';
import { ElementDetailsModal } from './ElementDetailsModal.tsx';

interface FunnelBoardProps {
  devices: Device[];
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
  onRefreshDevices: () => Promise<void>;
  onAddToFlow?: (step: FunnelStep) => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  uiHierarchyXml: string;
  setUiHierarchyXml: (xml: string) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  highlightedElementId: string | null;
  setHighlightedElementId: (id: string | null) => void;
}

export const FunnelBoard: React.FC<FunnelBoardProps> = ({
  devices,
  selectedDevice,
  setSelectedDevice,
  onRefreshDevices,
  onAddToFlow,
  capturedImage,
  setCapturedImage,
  uiHierarchyXml,
  setUiHierarchyXml,
  selectedElementId,
  setSelectedElementId,
  highlightedElementId,
  setHighlightedElementId
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSecuredScreen, setIsSecuredScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justAddedToFlow, setJustAddedToFlow] = useState(false);

  // Resizable horizontal split state
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState<number>(55);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 20 && newRatio <= 80) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Modal state
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

  // Perform screen inspection & hierarchy dump
  const handleInspect = async () => {
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
      console.error('Inspection failed:', err);
      if (err.message && (err.message.includes('blank') || err.message.includes('secured'))) {
        setIsSecuredScreen(true);
      }
      setErrorMessage(err.message || 'Falha ao inspecionar tela do dispositivo.');
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
        alert('Arquivo ZIP da captura salvo com sucesso!');
      }
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
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
      alert(`Falha ao carregar ZIP: ${err.message}`);
    }
  };

  // Add current screen to Flow Sequence with full structure
  const handleAddCurrentToFlow = () => {
    if (!capturedImage || !uiHierarchyXml || !onAddToFlow) return;
    const pkg = extractActivePackage(allElements);
    const step: FunnelStep = {
      id: `step_${Date.now()}`,
      title: pkg,
      packageName: pkg,
      timestamp: new Date().toISOString(),
      formattedDate: formatBrazilianDateTime(Date.now()),
      screenshot: capturedImage,
      xml: uiHierarchyXml,
      allElements: allElements,
      rootElements: rootElements,
      selectedElement: selectedElement
    };
    onAddToFlow(step);
    setJustAddedToFlow(true);
    setTimeout(() => setJustAddedToFlow(false), 2000);
  };

  return (
    <div className="space-y-2 h-[calc(100vh-80px)] flex flex-col w-full">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-jb-panel rounded p-2 border border-slate-200 dark:border-jb-border shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 transition-colors">
        {/* Device selector */}
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-jb-accent" />
          <select
            value={selectedDevice || ''}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs font-medium py-1 px-2.5 rounded border border-slate-300 dark:border-jb-border bg-white dark:bg-jb-elevated text-slate-800 dark:text-jb-text focus:outline-none focus:ring-1 focus:ring-jb-accent"
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

          <button
            onClick={onRefreshDevices}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-textMuted transition-colors"
            title="Atualizar lista de aparelhos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Inspect Screen & Add to Flow */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInspect}
            disabled={isCapturing || !selectedDevice}
            className="px-3 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-300 dark:disabled:bg-jb-elevated disabled:text-slate-500 dark:disabled:text-jb-textMuted text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            title="Inspecionar e analisar toda a estrutura da tela atual"
          >
            <ScanEye className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? 'Analisando Tela...' : 'Inspect Screen'}
          </button>

          {capturedImage && onAddToFlow && (
            <button
              onClick={handleAddCurrentToFlow}
              className={`px-3 py-1.5 rounded font-medium text-xs flex items-center gap-1.5 border transition-all ${
                justAddedToFlow
                  ? 'bg-jb-success text-white border-jb-success'
                  : 'bg-slate-50 dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-800 dark:text-jb-text border-slate-300 dark:border-jb-border'
              }`}
              title="Salvar estrutura completa no Funnel Flow para análise posterior"
            >
              {justAddedToFlow && <Check className="w-3.5 h-3.5 text-white" />}
              {justAddedToFlow ? 'Salvo no Flow!' : 'Add to Flow'}
            </button>
          )}

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-jb-border mx-0.5" />

          {/* Download Icon: Carregar pacote .zip existente */}
          <button
            onClick={handleLoadZip}
            className="p-1.5 rounded border border-slate-200 dark:border-jb-border hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text transition-colors"
            title="Carregar pacote .zip existente"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Upload Icon: Salvar inspeção como pacote .zip */}
          <button
            onClick={handleSaveZip}
            disabled={!capturedImage}
            className="p-1.5 rounded border border-slate-200 dark:border-jb-border hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text disabled:opacity-40 transition-colors"
            title="Salvar inspeção como pacote .zip"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Security alert if screen is black/secured */}
      {isSecuredScreen && (
        <div className="p-2.5 rounded bg-blue-50 dark:bg-jb-elevated border border-blue-200 dark:border-jb-border text-xs text-blue-900 dark:text-jb-text flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-jb-accent shrink-0" />
          <span>Tela com proteção (FLAG_SECURE ou bloqueada). A árvore hierárquica XML ainda foi inspecionada!</span>
        </div>
      )}

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-2.5 rounded bg-rose-50 dark:bg-[#351E20] border border-rose-200 dark:border-jb-error/40 text-xs text-rose-800 dark:text-jb-error flex items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-jb-error shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Area (Canvas on Left, Tree on Right) with Horizontal Resizer */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row gap-0 min-h-0 w-full relative"
      >
        {/* Canvas Section */}
        <div
          style={{ width: `${splitRatio}%` }}
          className={`h-full flex flex-col min-h-0 overflow-hidden pr-1 ${isDragging ? 'pointer-events-none' : ''}`}
        >
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

        {/* Resizable Splitter Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 relative flex items-center justify-center cursor-col-resize hover:bg-jb-accent/30 active:bg-jb-accent group select-none shrink-0 transition-colors z-10"
          title="Arraste para redimensionar telas de preview e estrutura"
        >
          <div className="w-[1px] h-full bg-slate-200 dark:bg-jb-border group-hover:bg-jb-accent transition-colors flex items-center justify-center">
            <div className="w-1 h-8 rounded-full bg-slate-400 dark:bg-jb-textMuted group-hover:bg-white" />
          </div>
        </div>

        {/* Hierarchy Tree Section */}
        <div
          style={{ width: `${100 - splitRatio}%` }}
          className={`h-full flex flex-col min-h-0 overflow-hidden pl-1 ${isDragging ? 'pointer-events-none' : ''}`}
        >
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
          onRefreshAfterAction={handleInspect}
        />
      )}
    </div>
  );
};
