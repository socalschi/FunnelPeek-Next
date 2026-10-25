import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Trash2, 
  Camera, 
  Layers, 
  Clock, 
  ExternalLink, 
  FileText, 
  Copy,
  Check
} from 'lucide-react';
import { FunnelStep } from '../types/index.ts';
import { formatBrazilianDateTime, formatXml, parseHierarchyXml } from '../utils/xmlParser.ts';
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
  const [copiedXml, setCopiedXml] = useState(false);

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

  // Selected step (falls back to the first step in the current order, or null)
  const selectedStep = useMemo(() => {
    if (selectedStepId) {
      const found = steps.find(s => s.id === selectedStepId);
      if (found) return found;
    }
    return displayedSteps.length > 0 ? displayedSteps[0] : null;
  }, [steps, selectedStepId, displayedSteps]);

  // Count mapped elements
  const allElementsCount = useMemo(() => {
    if (!selectedStep?.xml) return 0;
    if (selectedStep.allElements?.length) return selectedStep.allElements.length;
    const { allElements } = parseHierarchyXml(selectedStep.xml);
    return allElements.length;
  }, [selectedStep]);

  // Prettify XML keeping its structural hierarchy and indentation
  const formattedXml = useMemo(() => {
    if (!selectedStep?.xml) return '';
    return formatXml(selectedStep.xml);
  }, [selectedStep?.xml]);

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
              Fluxo sequencial de navegação e histórico de estruturas XML
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

      {/* Horizontal Flow Storyboard Container */}
      <div className="bg-white dark:bg-jb-panel rounded p-3.5 border border-slate-200 dark:border-jb-border shadow-xs">
        {/* Top-Right Sort Order Button (Rotated 90º with opposing arrows, no text) */}
        {displayedSteps.length > 0 && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-jb-border/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-jb-textMuted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-jb-accent" />
              Histórico de Telas ({displayedSteps.length})
            </span>
            <button
              onClick={toggleSortOrder}
              className="p-1.5 rounded bg-slate-50 dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-border border border-slate-200 dark:border-jb-border text-slate-700 dark:text-jb-text transition-colors shadow-xs group"
              title={sortOrder === 'asc' 
                ? 'Ordem atual: Crescente (criação mais antiga primeiro). Clique para Decrescente.' 
                : 'Ordem atual: Decrescente (criação mais recente primeiro). Clique para Crescente.'}
            >
              <SortOrderIcon className={`w-3.5 h-3.5 text-slate-600 dark:text-jb-text group-hover:text-jb-accent transition-transform duration-200 ${sortOrder === 'asc' ? '' : 'scale-x-[-1]'}`} />
            </button>
          </div>
        )}

        {displayedSteps.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-jb-textMuted">
            <Layers className="w-8 h-8 stroke-1 mx-auto text-slate-300 dark:text-jb-borderStrong mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-jb-text">Nenhuma tela no fluxo ainda</p>
            <p className="text-[11px] text-slate-400 dark:text-jb-textMuted max-w-md mx-auto mt-0.5">
              Conecte o aparelho, navegue até a tela desejada e clique em "Adicionar Tela ao Flow" para registrar a jornada com captura e estrutura XML.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 overflow-x-auto pb-2 pt-1">
            {displayedSteps.map((step, idx) => {
              const isSelected = selectedStep?.id === step.id;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <div
                    onClick={() => setSelectedStepId(step.id)}
                    onDoubleClick={() => onRestoreToBoard(step)}
                    className={`shrink-0 w-60 rounded border p-2.5 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-jb-accentHover/60 border-jb-accent shadow-sm ring-1 ring-jb-accent'
                        : 'bg-slate-50 dark:bg-jb-elevated/40 border-slate-200 dark:border-jb-border hover:border-jb-borderStrong shadow-xs'
                    }`}
                  >
                    {/* Preview box */}
                    <div className="w-full h-40 rounded bg-slate-200/80 dark:bg-jb-bg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-jb-border mb-2 relative group">
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

                      {/* Brazilian Date / Hour format: data - hora */}
                      <span className="text-[11px] font-mono text-slate-500 dark:text-jb-textMuted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-jb-textMuted" />
                        {step.formattedDate || formatBrazilianDateTime(step.timestamp)}
                      </span>
                    </div>

                    {/* Restore in Funnel Board button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreToBoard(step);
                      }}
                      className="mt-2.5 w-full py-1.5 px-2 rounded bg-white dark:bg-jb-elevated border border-slate-200 dark:border-jb-border hover:bg-jb-accent hover:text-white hover:border-jb-accent dark:hover:bg-jb-accent text-slate-700 dark:text-jb-text text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      title="Restaurar toda a estrutura e abrir no Funnel Board"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Selected Screen Deep Inspector: Clean Original Layout with Structured XML */}
      {selectedStep && (
        <div className="bg-white dark:bg-jb-panel rounded p-4 border border-slate-200 dark:border-jb-border shadow-xs flex flex-col lg:flex-row gap-5 items-stretch">
          {/* Left Preview Column */}
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col justify-between">
            <div className="flex-1 rounded overflow-hidden bg-slate-100 dark:bg-jb-bg flex items-center justify-center border border-slate-200 dark:border-jb-border p-2 min-h-[460px] max-h-[500px]">
              <img
                src={`data:image/png;base64,${selectedStep.screenshot}`}
                alt={selectedStep.packageName}
                className="max-h-[460px] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => onRestoreToBoard(selectedStep)}
              className="mt-2.5 w-full py-2 px-3 rounded bg-jb-accent hover:bg-[#2F65D4] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir esta Tela no Funnel Board
            </button>
          </div>

          {/* Right Details Column: XML dump stretches down to match the bottom alignment of the button */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top Details & Annotations */}
            <div className="shrink-0 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-500 dark:text-jb-textMuted uppercase tracking-wider">
                DETALHES DA ESTRUTURA ARMAZENADA
              </h3>

              {/* App Package & Time */}
              <div className="p-3 rounded bg-slate-50 dark:bg-jb-elevated/40 border border-slate-200 dark:border-jb-border space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium">Package em Execução:</span>
                  <span className="font-mono font-bold text-jb-accent text-xs">
                    {selectedStep.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium">Data e Hora da Captura:</span>
                  <span className="font-mono text-slate-700 dark:text-jb-text text-xs">
                    {selectedStep.formattedDate || formatBrazilianDateTime(selectedStep.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium">Elementos UI Mapeados:</span>
                  <span className="font-mono text-jb-success font-semibold">
                    {allElementsCount} nós
                  </span>
                </div>
              </div>

              {/* Notes / User Annotation */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-jb-text block">
                  Anotações da Etapa / Ação Realizada:
                </label>
                <textarea
                  value={selectedStep.notes || ''}
                  onChange={(e) => updateStepNotes(selectedStep.id, e.target.value)}
                  placeholder="Ex: Usuário preencheu os campos e clicou no botão Entrar..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded border border-slate-200 dark:border-jb-border bg-slate-50 dark:bg-jb-elevated text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent resize-none"
                />
              </div>
            </div>

            {/* XML Dump Container - Stretches to align perfectly with bottom of "Abrir esta Tela no Funnel Board" button */}
            <div className="flex-1 min-h-[180px] mt-2.5 flex flex-col">
              <div className="flex items-center justify-between text-xs mb-1 shrink-0">
                <span className="font-medium text-slate-700 dark:text-jb-text flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-jb-accent" />
                  Preview do Dump XML
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(formattedXml);
                      setCopiedXml(true);
                      setTimeout(() => setCopiedXml(false), 2000);
                    }}
                    className="text-[11px] text-jb-accent hover:underline flex items-center gap-1"
                    title="Copiar XML com estrutura hierárquica formatada"
                  >
                    {copiedXml ? <Check className="w-3 h-3 text-jb-success" /> : <Copy className="w-3 h-3" />}
                    {copiedXml ? 'Copiado!' : 'Copiar'}
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-jb-textMuted">
                    {selectedStep.xml.length} bytes
                  </span>
                </div>
              </div>

              {/* Structured XML code box */}
              <div className="flex-1 min-h-0 p-2.5 rounded bg-slate-900 dark:bg-jb-bg text-slate-300 dark:text-jb-text font-mono text-[11px] leading-relaxed overflow-auto border border-slate-800 dark:border-jb-border select-all">
                <pre className="whitespace-pre font-mono m-0">{formattedXml}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
