import React, { useState } from 'react';
import { Plus, ArrowRight, Trash2, Camera, Download, Layers, Calendar, Smartphone, FileCode2 } from 'lucide-react';
import { FunnelStep, Device } from '../types/index.ts';

interface FunnelFlowProps {
  steps: FunnelStep[];
  setSteps: React.Dispatch<React.SetStateAction<FunnelStep[]>>;
  selectedDevice: string | null;
  onCaptureStep: () => Promise<void>;
  isCapturing: boolean;
}

export const FunnelFlow: React.FC<FunnelFlowProps> = ({
  steps,
  setSteps,
  selectedDevice,
  onCaptureStep,
  isCapturing
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const updateStepTitle = (id: string, title: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  const updateStepNotes = (id: string, notes: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
            User Experience & Flow Sequence
          </span>
          <h2 className="text-2xl font-bold mt-1 tracking-tight">Funnel Flow Storyboard</h2>
          <p className="text-sm text-blue-100 max-w-xl mt-1">
            Capture multi-screen user journeys, track onboarding flows, checkout steps, or conversion funnels directly from your connected device.
          </p>
        </div>

        <button
          onClick={onCaptureStep}
          disabled={isCapturing || !selectedDevice}
          className="px-5 py-3 rounded-xl bg-white text-blue-600 hover:bg-blue-50 disabled:bg-white/50 disabled:text-blue-300 font-semibold text-sm flex items-center gap-2 shadow-lg transition-all"
        >
          <Camera className={`w-4 h-4 ${isCapturing ? 'animate-pulse' : ''}`} />
          {isCapturing ? 'Capturing Step...' : 'Add Current Screen to Funnel'}
        </button>
      </div>

      {/* Steps Flow Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Funnel Steps ({steps.length})
          </h3>

          {steps.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all steps in current funnel?')) setSteps([]);
              }}
              className="text-xs text-rose-500 hover:underline"
            >
              Clear Funnel
            </button>
          )}
        </div>

        {steps.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Layers className="w-12 h-12 stroke-1 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your funnel storyboard is empty</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Navigate to a screen on your device and click "Add Current Screen to Funnel" to record each sequential step of your user flow.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-4 overflow-x-auto pb-4 pt-1">
            {steps.map((step, idx) => {
              const isSelected = step.id === selectedStepId;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <div
                    onClick={() => setSelectedStepId(step.id)}
                    className={`shrink-0 w-64 rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
                        Step {idx + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Screenshot thumbnail */}
                    <div className="w-full h-44 rounded-lg bg-black overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 mb-2">
                      <img
                        src={`data:image/png;base64,${step.screenshot}`}
                        alt={step.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Step Title Input */}
                    <input
                      type="text"
                      value={step.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStepTitle(step.id, e.target.value)}
                      placeholder="Step name..."
                      className="w-full text-xs font-semibold px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                    />

                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="shrink-0 self-center text-slate-300 dark:text-slate-600">
                      <ArrowRight className="w-6 h-6 stroke-2" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Step Detail Inspector */}
      {selectedStep && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Step Preview</h4>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[460px] border border-slate-800">
              <img
                src={`data:image/png;base64,${selectedStep.screenshot}`}
                alt={selectedStep.title}
                className="max-h-full object-contain"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Step Title
              </label>
              <input
                type="text"
                value={selectedStep.title}
                onChange={(e) => updateStepTitle(selectedStep.id, e.target.value)}
                className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Flow Notes / Action Description
              </label>
              <textarea
                value={selectedStep.notes || ''}
                onChange={(e) => updateStepNotes(selectedStep.id, e.target.value)}
                placeholder="E.g. User enters valid credentials and taps 'Continue', or completes KYC step..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Capture Timestamp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedStep.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>XML Hierarchy Size:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedStep.xml.length} characters</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
