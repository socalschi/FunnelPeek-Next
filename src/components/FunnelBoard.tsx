import React, { useState, useMemo } from 'react';
import { ScanEye, RefreshCw, Smartphone, Download, Upload, Plus, AlertCircle, ShieldAlert, Check } from 'lucide-react';
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
    <div className="space-y-3 h-[calc(100vh-100px)] flex flex-col w-full">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0 transition-colors">
        {/* Device selector */}
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-500" />
          <select
            value={selectedDevice || ''}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Atualizar lista de aparelhos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Inspect Screen & + Add to Flow */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInspect}
            disabled={isCapturing || !selectedDevice}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            title="Inspecionar e analisar toda a estrutura da tela atual"
          >
            <ScanEye className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? 'Analisando Tela...' : 'Inspect Screen'}
          </button>

          {capturedImage && onAddToFlow && (
            <button
              onClick={handleAddCurrentToFlow}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border transition-all shadow-sm ${
                justAddedToFlow
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              }`}
              title="Salvar estrutura completa no Funnel Flow para análise posterior"
            >
              {justAddedToFlow ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {justAddedToFlow ? 'Salvo no Flow!' : '+ Add to Flow'}
            </button>
          )}

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={handleSaveZip}
            disabled={!capturedImage}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
            title="Salvar inspeção como pacote .zip"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleLoadZip}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Carregar pacote .zip existente"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security alert if screen is black/secured */}
      {isSecuredScreen && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Tela com proteção (FLAG_SECURE ou bloqueada). A árvore hierárquica XML ainda foi inspecionada!</span>
        </div>
      )}

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2 shadow-sm animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
          onRefreshAfterAction={handleInspect}
        />
      )}
    </div>
  );
};
