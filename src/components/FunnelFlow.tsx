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
    <div className="w-full space-y-4 px-1">
      {/* Sleek Top Toolbar (Clean, non-cluttered) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Funnel Flow</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {steps.length} {steps.length === 1 ? 'tela registrada' : 'telas registradas'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Fluxo sequencial de navegação e histórico completo de estruturas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja limpar todo o fluxo de telas?')) setSteps([]);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors"
            >
              Limpar Fluxo
            </button>
          )}

          <button
            onClick={onCaptureStep}
            disabled={isCapturing || !selectedDevice}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Camera className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
            {isCapturing ? 'Inspecionando Tela...' : '+ Adicionar Tela ao Flow'}
          </button>
        </div>
      </div>

      {/* Horizontal Flow Storyboard */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        {steps.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Layers className="w-10 h-10 stroke-1 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma tela no fluxo ainda</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Conecte o aparelho, navegue até a tela desejada e clique em "+ Adicionar Tela ao Flow" para registrar os passos da jornada com toda a estrutura XML e dados.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-4 overflow-x-auto pb-3 pt-1">
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
                    className={`shrink-0 w-64 rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm'
                    }`}
                  >
                    {/* Preview box */}
                    <div className="w-full h-44 rounded-xl bg-slate-200/80 dark:bg-black overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 mb-2 relative group">
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
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 shadow"
                        title="Remover tela"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* App Package Name */}
                    <div className="space-y-1">
                      <span
                        className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate block"
                        title={step.packageName}
                      >
                        {step.packageName || 'com.android.unknown'}
                      </span>

                      {/* Brazilian Date / Hour format: data(DD/MM/YY) - hora */}
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {step.formattedDate || formatBrazilianDateTime(step.timestamp)}
                      </span>
                    </div>

                    {/* Restore in Funnel Board button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreToBoard(step);
                      }}
                      className="mt-3 w-full py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      title="Restaurar toda a estrutura e abrir no Funnel Board"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Inspecionar no Board
                    </button>
                  </div>

                  {/* Flow Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="shrink-0 self-center text-slate-300 dark:text-slate-600">
                      <ArrowRight className="w-5 h-5 stroke-2" />
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Preview */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/90 flex items-center justify-center max-h-[460px] border border-slate-200 dark:border-slate-800 p-2 shadow-inner">
              <img
                src={`data:image/png;base64,${selectedStep.screenshot}`}
                alt={selectedStep.packageName}
                className="max-h-[440px] w-auto object-contain"
              />
            </div>
            <button
              onClick={() => onRestoreToBoard(selectedStep)}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir esta Tela no Funnel Board
            </button>
          </div>

          {/* Right Details with Vertical Scrolling */}
          <div className="lg:col-span-8 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Detalhes da Estrutura Armazenada
            </h3>

            <div className="overflow-y-auto max-h-[450px] pr-2 space-y-3">
              {/* App Package & Time */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Package em Execução:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {selectedStep.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Data e Hora da Captura:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                    {selectedStep.formattedDate || formatBrazilianDateTime(selectedStep.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Elementos UI Mapeados:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {selectedStep.allElements?.length || 'Estrutura XML Completa'} nós
                  </span>
                </div>
              </div>

              {/* Notes / User Annotation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Anotações da Etapa / Ação Realizada:
                </label>
                <textarea
                  value={selectedStep.notes || ''}
                  onChange={(e) => updateStepNotes(selectedStep.id, e.target.value)}
                  placeholder="Ex: Usuário preencheu os campos e clicou no botão Entrar..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* XML Hierarchy Snapshot preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Preview do Dump XML
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedStep.xml.length} bytes
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] max-h-36 overflow-auto border border-slate-800 select-all">
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
