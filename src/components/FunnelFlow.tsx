import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Trash2, 
  Camera, 
  Layers, 
  Clock, 
  ExternalLink, 
  FileText, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { FunnelStep, UIElement } from '../types/index.ts';
import { parseHierarchyXml, filterElements, searchByXPath, formatBrazilianDateTime } from '../utils/xmlParser.ts';
import { CanvasImageRenderer } from './CanvasImageRenderer.tsx';
import { ElementTree } from './ElementTree.tsx';
import { ElementDetailsModal } from './ElementDetailsModal.tsx';
import { SortOrderIcon } from './SortOrderIcon.tsx';

interface FunnelFlowProps {
  steps: FunnelStep[];
  setSteps: React.Dispatch<React.SetStateAction<FunnelStep[]>>;
  selectedDevice: string | null;
  onCaptureStep: () => Promise<void>;
  isCapturing: boolean;
  onRestoreToBoard: (step: FunnelStep) => void;
}

export const FunnelFlow: React.FC<FunnelFlowProps> = ({
  steps,
  setSteps,
  selectedDevice,
  onCaptureStep,
  isCapturing,
  onRestoreToBoard
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Sorting preference: 'asc' (oldest first) or 'desc' (newest first)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    try {
      const saved = localStorage.getItem('funnelpeek_flow_sort_order');
      return saved === 'desc' ? 'desc' : 'asc';
    } catch {
      return 'asc';
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      const next = prev === 'asc' ? 'desc' : 'asc';
      try {
        localStorage.setItem('funnelpeek_flow_sort_order', next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Sort displayed steps according to creation timestamp
  const displayedSteps = useMemo(() => {
    const list = [...steps];
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return list;
  }, [steps, sortOrder]);

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const updateStepNotes = (id: string, notes: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  };

  // Active selected step (falls back to the first step in the current sort order)
  const selectedStep = useMemo(() => {
    if (selectedStepId) {
      const found = steps.find(s => s.id === selectedStepId);
      if (found) return found;
    }
    return displayedSteps.length > 0 ? displayedSteps[0] : null;
  }, [steps, selectedStepId, displayedSteps]);

  // Parse UI Hierarchy XML for the active step so structure is loaded alongside the preview!
  const { rootElements, allElements } = useMemo(() => {
    if (!selectedStep?.xml) {
      return { rootElements: [], allElements: [] };
    }
    if (selectedStep.rootElements && selectedStep.allElements && selectedStep.allElements.length > 0) {
      return { rootElements: selectedStep.rootElements, allElements: selectedStep.allElements };
    }
    return parseHierarchyXml(selectedStep.xml);
  }, [selectedStep]);

  // Selected element inside the flow structure inspector
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Search in structure tree
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'xpath'>('text');

  // Canvas display controls
  const [showAllRectangles, setShowAllRectangles] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Splitter state for preview canvas vs hierarchy tree
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState<number>(45);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Collapsible notes/xml drawer
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

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

  // Filtered elements for search
  const filteredElements = useMemo(() => {
    if (!searchQuery.trim() || !selectedStep?.xml) return [];
    if (searchMode === 'xpath') {
      return searchByXPath(selectedStep.xml, searchQuery, allElements);
    }
    return filterElements(allElements, searchQuery);
  }, [searchQuery, searchMode, selectedStep?.xml, allElements]);

  // Selected element reference
  const selectedElement = useMemo(() => {
    return allElements.find(el => el.id === selectedElementId) || null;
  }, [allElements, selectedElementId]);

  return (
    <div className="w-full space-y-3 px-1 pb-4">
      {/* Sleek Top Toolbar */}
      <div className="bg-white dark:bg-jb-panel rounded p-3 border border-slate-200 dark:border-jb-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-blue-50 dark:bg-jb-elevated text-jb-accent border border-blue-200 dark:border-jb-border">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-jb-text">Funnel Flow</h2>
              <span className="text-[11px] font-medium px-2 py-0.2 rounded bg-slate-100 dark:bg-jb-elevated text-slate-600 dark:text-jb-textMuted border border-slate-200 dark:border-jb-border">
                {steps.length} {steps.length === 1 ? 'tela registrada' : 'telas registradas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-jb-textMuted">
              Sequência de telas com preview visual e estrutura XML hierárquica completa sincronizados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <button
              onClick={async () => {
                if (confirm('Tem certeza que deseja limpar todo o fluxo de telas?')) {
                  setSteps([]);
                  if (window.electronAPI?.clearFlowState) {
                    await window.electronAPI.clearFlowState();
                  }
                }
              }}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-jb-border hover:bg-rose-50 dark:hover:bg-[#351E20] text-slate-600 dark:text-jb-textMuted hover:text-rose-600 dark:hover:text-jb-error text-xs font-medium transition-colors"
            >
              Limpar Fluxo
            </button>
          )}

          <button
            onClick={onCaptureStep}
            disabled={isCapturing || !selectedDevice}
            className="px-3.5 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-300 dark:disabled:bg-jb-elevated disabled:text-slate-500 dark:disabled:text-jb-textMuted text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? 'Inspecionando Tela...' : 'Adicionar Tela ao Flow'}
          </button>
        </div>
      </div>

      {/* Horizontal Flow Storyboard Container with Top-Right Sort Order Toggle */}
      <div className="bg-white dark:bg-jb-panel rounded p-3 border border-slate-200 dark:border-jb-border shadow-xs">
        {/* Header of Storyboard with Sort Button in the Top-Right Corner */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-jb-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-jb-text flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-jb-accent" />
              Histórico com os Previews
            </span>
            {displayedSteps.length > 0 && (
              <span className="text-[11px] text-slate-500 dark:text-jb-textMuted font-mono">
                ({displayedSteps.length} {displayedSteps.length === 1 ? 'item' : 'itens'} • {sortOrder === 'asc' ? 'Criação: Mais antigas → Recentes' : 'Criação: Recentes → Mais antigas'})
              </span>
            )}
          </div>

          {/* User Requested Sort Toggle Button in Top-Right Corner */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-border border border-slate-200 dark:border-jb-border text-slate-700 dark:text-jb-text text-xs font-medium transition-colors shadow-xs group"
            title={sortOrder === 'asc' 
              ? 'Ordem atual: Crescente (criação mais antiga primeiro). Clique para alternar para Decrescente.' 
              : 'Ordem atual: Decrescente (criação mais recente primeiro). Clique para alternar para Crescente.'}
          >
            <SortOrderIcon className="w-3.5 h-3.5 text-slate-600 dark:text-jb-text group-hover:text-jb-accent transition-colors" />
            <span className="text-[11px] font-semibold">
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </span>
          </button>
        </div>

        {displayedSteps.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-jb-textMuted">
            <Layers className="w-8 h-8 stroke-1 mx-auto text-slate-300 dark:text-jb-borderStrong mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-jb-text">Nenhuma tela no fluxo ainda</p>
            <p className="text-[11px] text-slate-400 dark:text-jb-textMuted max-w-md mx-auto mt-0.5">
              Conecte o aparelho e clique em "Adicionar Tela ao Flow" para registrar a jornada com captura e estrutura XML sincronizadas.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 overflow-x-auto pb-2 pt-1">
            {displayedSteps.map((step, idx) => {
              const isSelected = selectedStep?.id === step.id;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Card with Requested Layout:
                      ╔═══════╗
                      ║ PREVIA║
                      ╚═══════╝
                      packagename
                      data - hora
                  */}
                  <div
                    onClick={() => {
                      setSelectedStepId(step.id);
                      setSelectedElementId(null);
                      setHighlightedElementId(null);
                    }}
                    onDoubleClick={() => onRestoreToBoard(step)}
                    className={`shrink-0 w-56 rounded border p-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-jb-accentHover/60 border-jb-accent shadow-sm ring-1 ring-jb-accent'
                        : 'bg-slate-50 dark:bg-jb-elevated/40 border-slate-200 dark:border-jb-border hover:border-jb-borderStrong shadow-xs'
                    }`}
                    title="Clique para inspecionar preview e estrutura abaixo • Duplo clique para abrir no Funnel Board"
                  >
                    {/* Preview box */}
                    <div className="w-full h-36 rounded bg-slate-200/80 dark:bg-jb-bg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-jb-border mb-2 relative group">
                      <img
                        src={`data:image/png;base64,${step.screenshot}`}
                        alt={step.packageName}
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 shadow-xs"
                        title="Remover tela"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* App Package Name */}
                    <div className="space-y-0.5">
                      <span
                        className="font-mono text-xs font-bold text-slate-900 dark:text-jb-text truncate block"
                        title={step.packageName}
                      >
                        {step.packageName || 'com.android.unknown'}
                      </span>

                      {/* Brazilian Date / Hour format */}
                      <span className="text-[10px] font-mono text-slate-500 dark:text-jb-textMuted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-jb-textMuted" />
                        {step.formattedDate || formatBrazilianDateTime(step.timestamp)}
                      </span>
                    </div>

                    {/* Quick Restore in Board button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreToBoard(step);
                      }}
                      className="mt-2 w-full py-1 px-2 rounded bg-white dark:bg-jb-elevated border border-slate-200 dark:border-jb-border hover:bg-jb-accent hover:text-white hover:border-jb-accent dark:hover:bg-jb-accent text-slate-700 dark:text-jb-text text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      title="Restaurar toda a estrutura e abrir no Funnel Board"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspecionar no Board
                    </button>
                  </div>

                  {/* Flow Arrow */}
                  {idx < displayedSteps.length - 1 && (
                    <div className="shrink-0 self-center text-slate-300 dark:text-jb-borderStrong">
                      <ArrowRight className="w-4 h-4 stroke-2" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Step Full Inspector: Preview + Complete XML Structure Loaded Together! */}
      {selectedStep && (
        <div className="bg-white dark:bg-jb-panel rounded border border-slate-200 dark:border-jb-border shadow-xs flex flex-col overflow-hidden">
          {/* Active Step Top Status & Action Bar */}
          <div className="p-3 bg-slate-50 dark:bg-jb-elevated/60 border-b border-slate-200 dark:border-jb-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-jb-textMuted block">
                  Tela Selecionada no Flow
                </span>
                <span className="text-sm font-mono font-bold text-jb-accent">
                  {selectedStep.packageName}
                </span>
              </div>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-jb-border hidden sm:block" />

              <div className="text-xs font-mono text-slate-600 dark:text-jb-textMuted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedStep.formattedDate || formatBrazilianDateTime(selectedStep.timestamp)}</span>
              </div>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-jb-border hidden sm:block" />

              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-jb-success border border-emerald-200 dark:border-emerald-800/40 font-mono font-semibold">
                  {allElements.length} nós na estrutura
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotesDrawer(prev => !prev)}
                className={`px-2.5 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showNotesDrawer
                    ? 'bg-blue-50 dark:bg-jb-accentHover border-jb-accent text-jb-accent'
                    : 'bg-white dark:bg-jb-elevated border-slate-200 dark:border-jb-border text-slate-700 dark:text-jb-text hover:bg-slate-100 dark:hover:bg-jb-border'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Anotações & XML</span>
                {showNotesDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onRestoreToBoard(selectedStep)}
                className="px-3 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                title="Abrir esta tela completa com todos os nós no Funnel Board principal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir no Funnel Board
              </button>
            </div>
          </div>

          {/* Collapsible Notes & Raw XML Drawer */}
          {showNotesDrawer && (
            <div className="p-3 bg-slate-100/70 dark:bg-jb-bg/80 border-b border-slate-200 dark:border-jb-border grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-jb-text block mb-1">
                  Anotações da Etapa / Comportamento:
                </label>
                <textarea
                  value={selectedStep.notes || ''}
                  onChange={(e) => updateStepNotes(selectedStep.id, e.target.value)}
                  placeholder="Descreva as ações realizadas nesta tela do fluxo..."
                  rows={4}
                  className="w-full text-xs p-2.5 rounded border border-slate-200 dark:border-jb-border bg-white dark:bg-jb-elevated text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-jb-text flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-jb-accent" />
                    Dump XML UI Hierarchy ({selectedStep.xml.length} bytes)
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedStep.xml);
                      setCopiedXml(true);
                      setTimeout(() => setCopiedXml(false), 2000);
                    }}
                    className="text-[11px] text-jb-accent hover:underline flex items-center gap-1"
                  >
                    {copiedXml ? <Check className="w-3 h-3 text-jb-success" /> : <Copy className="w-3 h-3" />}
                    {copiedXml ? 'Copiado!' : 'Copiar XML'}
                  </button>
                </div>
                <div className="p-2 rounded bg-slate-900 dark:bg-jb-bg text-slate-300 dark:text-jb-text font-mono text-[10px] h-24 overflow-auto border border-slate-800 dark:border-jb-border select-all">
                  <pre className="whitespace-pre-wrap break-all">{selectedStep.xml.slice(0, 3000)}...</pre>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Split View: Preview Canvas on Left, Hierarchy Tree on Right */}
          <div
            ref={containerRef}
            className="flex-1 flex flex-col md:flex-row gap-0 min-h-[540px] h-[540px] w-full relative overflow-hidden"
          >
            {/* Left Canvas Preview */}
            <div
              style={{ width: `${splitRatio}%` }}
              className={`h-full flex flex-col min-h-0 min-w-0 overflow-hidden pr-0.5 ${isDragging ? 'pointer-events-none' : ''}`}
            >
              <CanvasImageRenderer
                base64Image={selectedStep.screenshot}
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

            {/* Resizer Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="w-2 relative flex items-center justify-center cursor-col-resize hover:bg-jb-accent/30 active:bg-jb-accent group select-none shrink-0 transition-colors z-10"
              title="Arraste para redimensionar telas de preview e estrutura"
            >
              <div className="w-[1px] h-full bg-slate-200 dark:bg-jb-border group-hover:bg-jb-accent transition-colors flex items-center justify-center">
                <div className="w-1 h-8 rounded-full bg-slate-400 dark:bg-jb-textMuted group-hover:bg-white" />
              </div>
            </div>

            {/* Right Hierarchy Tree Loaded Together with Preview */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className={`h-full flex flex-col min-h-0 min-w-0 overflow-hidden pl-0.5 ${isDragging ? 'pointer-events-none' : ''}`}
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
        </div>
      )}

      {/* Details & Actions Modal for Selected Element in Funnel Flow */}
      {isDetailsModalOpen && selectedElement && (
        <ElementDetailsModal
          element={selectedElement}
          elements={searchQuery.trim() && filteredElements.length > 0 ? filteredElements : allElements}
          onSelectElement={setSelectedElementId}
          deviceId={selectedDevice}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};
