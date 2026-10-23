import React, { useState } from 'react';
import { Plus, ArrowRight, Trash2, Camera, Layers, Clock, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { FunnelStep } from '../types/index.ts';
import { formatBrazilianDateTime } from '../utils/xmlParser.ts';

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

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const updateStepNotes = (id: string, notes: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  };

  const selectedStep = steps.find(s => s.id === selectedStepId) || (steps.length > 0 ? steps[steps.length - 1] : null);

  return (
    <div className="w-full space-y-3 px-1">
      {/* Sleek Top Toolbar (Clean, non-cluttered) */}
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
            <p className="text-[11px] text-slate-500 dark:text-jb-textMuted">Fluxo sequencial de navegação e histórico de estruturas XML</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja limpar todo o fluxo de telas?')) setSteps([]);
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

      {/* Horizontal Flow Storyboard */}
      <div className="bg-white dark:bg-jb-panel rounded p-4 border border-slate-200 dark:border-jb-border shadow-xs">
        {steps.length === 0 ? (
          <div className="py-10 text-center text-slate-400 dark:text-jb-textMuted">
            <Layers className="w-8 h-8 stroke-1 mx-auto text-slate-300 dark:text-jb-borderStrong mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-jb-text">Nenhuma tela no fluxo ainda</p>
            <p className="text-[11px] text-slate-400 dark:text-jb-textMuted max-w-md mx-auto mt-0.5">
              Conecte o aparelho, navegue até a tela desejada e clique em "Adicionar Tela ao Flow" para registrar a jornada com captura e estrutura XML.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 overflow-x-auto pb-2 pt-1">
            {steps.map((step, idx) => {
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
                    onClick={() => setSelectedStepId(step.id)}
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

                      {/* Brazilian Date / Hour format: data(DD/MM/YY) - hora */}
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
                  {idx < steps.length - 1 && (
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

      {/* Selected Screen Deep Inspector with Vertical Scroll */}
      {selectedStep && (
        <div className="bg-white dark:bg-jb-panel rounded p-4 border border-slate-200 dark:border-jb-border shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Preview */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-full rounded overflow-hidden bg-slate-100 dark:bg-jb-bg flex items-center justify-center max-h-[440px] border border-slate-200 dark:border-jb-border p-2">
              <img
                src={`data:image/png;base64,${selectedStep.screenshot}`}
                alt={selectedStep.packageName}
                className="max-h-[420px] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => onRestoreToBoard(selectedStep)}
              className="mt-2.5 w-full py-2 px-3 rounded bg-jb-accent hover:bg-[#2F65D4] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir esta Tela no Funnel Board
            </button>
          </div>

          {/* Right Details with Vertical Scrolling */}
          <div className="lg:col-span-8 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold text-slate-500 dark:text-jb-textMuted uppercase tracking-wider mb-2">
              Detalhes da Estrutura Armazenada
            </h3>

            <div className="overflow-y-auto max-h-[450px] pr-2 space-y-2.5">
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
                    {selectedStep.allElements?.length || 'Estrutura XML Completa'} nós
                  </span>
                </div>
              </div>

              {/* Notes / User Annotation */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-jb-text">
                  Anotações da Etapa / Ação Realizada:
                </label>
                <textarea
                  value={selectedStep.notes || ''}
                  onChange={(e) => updateStepNotes(selectedStep.id, e.target.value)}
                  placeholder="Ex: Usuário preencheu os campos e clicou no botão Entrar..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded border border-slate-200 dark:border-jb-border bg-slate-50 dark:bg-jb-elevated text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent"
                />
              </div>

              {/* XML Hierarchy Snapshot preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-jb-text flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-jb-accent" />
                    Preview do Dump XML
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-jb-textMuted">
                    {selectedStep.xml.length} bytes
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 dark:bg-jb-bg text-slate-300 dark:text-jb-text font-mono text-[11px] max-h-36 overflow-auto border border-slate-800 dark:border-jb-border select-all">
                  <pre className="whitespace-pre-wrap break-all">{selectedStep.xml.slice(0, 1500)}...</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
