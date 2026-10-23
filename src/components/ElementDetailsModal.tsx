import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Touchpad,
  Copy,
  Check,
  Terminal,
  Send,
  ArrowLeft,
  Home,
  CornerDownLeft,
  Delete,
  Menu,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UIElement } from '../types/index.ts';
import { generateSelectors } from '../utils/xmlParser.ts';

interface ElementDetailsModalProps {
  element: UIElement | null;
  elements?: UIElement[];
  onSelectElement?: (elementId: string) => void;
  deviceId: string | null;
  onClose: () => void;
  onRefreshAfterAction?: () => void;
}

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({
  element,
  elements,
  onSelectElement,
  deviceId,
  onClose,
  onRefreshAfterAction
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'automation' | 'interaction'>('properties');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const elementsList = elements && elements.length > 0 ? elements : (element ? [element] : []);
  const currentIndex = element ? elementsList.findIndex(e => e.id === element.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < elementsList.length - 1;

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && onSelectElement) {
      const prevEl = elementsList[currentIndex - 1];
      onSelectElement(prevEl.id);
    }
  }, [currentIndex, onSelectElement, elementsList]);

  const goToNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < elementsList.length - 1 && onSelectElement) {
      const nextEl = elementsList[currentIndex + 1];
      onSelectElement(nextEl.id);
    }
  }, [currentIndex, onSelectElement, elementsList]);

  // Reset transient interaction state when navigated element changes
  useEffect(() => {
    setActionStatus(null);
    setTextInput('');
  }, [element?.id]);

  // Keyboard navigation: ArrowLeft, ArrowRight, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // If user is currently typing in an input or textarea, don't trigger left/right element switch
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  if (!element) return null;

  const selectors = generateSelectors(element);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Interaction: Tap
  const handleTap = async () => {
    if (!deviceId || !window.electronAPI) return;
    setIsExecuting(true);
    setActionStatus(null);
    try {
      const cx = Math.round((element.x1 + element.x2) / 2);
      const cy = Math.round((element.y1 + element.y2) / 2);
      await window.electronAPI.adbInputTap(deviceId, cx, cy);
      setActionStatus({ success: true, msg: `Tapped center (${cx}, ${cy}) successfully` });
      if (onRefreshAfterAction) setTimeout(onRefreshAfterAction, 600);
    } catch (err: any) {
      setActionStatus({ success: false, msg: err.message || 'Tap failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Interaction: Send Text
  const handleSendText = async () => {
    if (!deviceId || !textInput.trim() || !window.electronAPI) return;
    setIsExecuting(true);
    setActionStatus(null);
    try {
      // Tap center to focus first
      const cx = Math.round((element.x1 + element.x2) / 2);
      const cy = Math.round((element.y1 + element.y2) / 2);
      await window.electronAPI.adbInputTap(deviceId, cx, cy);
      await new Promise(r => setTimeout(r, 200));

      await window.electronAPI.adbInputText(deviceId, textInput);
      setActionStatus({ success: true, msg: `Sent text: "${textInput}"` });
      setTextInput('');
      if (onRefreshAfterAction) setTimeout(onRefreshAfterAction, 600);
    } catch (err: any) {
      setActionStatus({ success: false, msg: err.message || 'Failed to send text' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Interaction: Key event
  const handleKey = async (keycode: string) => {
    if (!deviceId || !window.electronAPI) return;
    setIsExecuting(true);
    setActionStatus(null);
    try {
      await window.electronAPI.adbInputKeyEvent(deviceId, keycode);
      setActionStatus({ success: true, msg: `Sent key event: ${keycode}` });
      if (onRefreshAfterAction) setTimeout(onRefreshAfterAction, 600);
    } catch (err: any) {
      setActionStatus({ success: false, msg: err.message || 'Keyevent failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      {/* Seta Esquerda (Elemento Anterior) */}
      <button
        onClick={goToPrev}
        disabled={!hasPrev}
        className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 mr-2 sm:mr-3 rounded-full bg-white/95 dark:bg-jb-panel/95 hover:bg-white dark:hover:bg-jb-elevated text-slate-700 dark:text-jb-text border border-slate-200 dark:border-jb-border shadow-2xl transition-all shrink-0 ${
          hasPrev
            ? 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer text-jb-accent hover:border-jb-accent ring-1 ring-jb-accent/30'
            : 'opacity-20 cursor-not-allowed'
        }`}
        title="Elemento Anterior (Seta Esquerda)"
      >
        <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Janela Principal do Elemento (Modal Box) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-jb-elevated rounded-lg shadow-2xl border border-slate-200 dark:border-jb-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative select-text"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-jb-border flex items-center justify-between bg-slate-50 dark:bg-jb-panel shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-jb-hover text-blue-700 dark:text-jb-accent font-semibold border border-blue-200 dark:border-jb-border shrink-0">
              &lt;{element.tagName}&gt;
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-jb-text truncate">
                {element.resourceId?.split('/').pop() || element.className.split('.').pop() || 'Element Details'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-jb-textMuted font-mono truncate">{element.bounds}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Position indicator */}
            {currentIndex >= 0 && elementsList.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-jb-bg text-slate-600 dark:text-jb-textMuted border border-slate-200 dark:border-jb-border">
                {currentIndex + 1} / {elementsList.length}
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-text hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-jb-border px-4 bg-white dark:bg-jb-panel text-xs">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'border-jb-accent text-blue-600 dark:text-jb-accent'
                : 'border-transparent text-slate-500 dark:text-jb-textMuted hover:text-slate-800 dark:hover:text-jb-text'
            }`}
          >
            Attributes & Properties
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`py-2 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'automation'
                ? 'border-jb-accent text-blue-600 dark:text-jb-accent'
                : 'border-transparent text-slate-500 dark:text-jb-textMuted hover:text-slate-800 dark:hover:text-jb-text'
            }`}
          >
            Automation Selectors
          </button>
          <button
            onClick={() => setActiveTab('interaction')}
            className={`py-2 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'interaction'
                ? 'border-jb-accent text-blue-600 dark:text-jb-accent'
                : 'border-transparent text-slate-500 dark:text-jb-textMuted hover:text-slate-800 dark:hover:text-jb-text'
            }`}
          >
            Remote Control & Actions
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'properties' && (
            <div className="space-y-3">
              {/* String Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Resource ID</span>
                  <p className="font-mono text-slate-800 dark:text-jb-text font-semibold break-all mt-0.5">
                    {element.resourceId || 'None'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Text</span>
                  <p className="text-emerald-700 dark:text-[#6AAB73] font-semibold mt-0.5">
                    {element.text ? `"${element.text}"` : 'None'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Class Name</span>
                  <p className="font-mono text-emerald-600 dark:text-jb-success font-semibold break-all mt-0.5">
                    {element.className || 'None'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Content Description</span>
                  <p className="text-slate-800 dark:text-jb-text font-semibold mt-0.5">
                    {element.contentDesc || 'None'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Package</span>
                  <p className="font-mono text-slate-800 dark:text-jb-text mt-0.5">{element.package || 'None'}</p>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                  <span className="text-slate-500 dark:text-jb-textMuted font-medium text-[11px]">Dimensions & Center</span>
                  <p className="font-mono text-slate-800 dark:text-jb-text mt-0.5">
                    {element.width}×{element.height} px (Center: {Math.round((element.x1 + element.x2) / 2)}, {Math.round((element.y1 + element.y2) / 2)})
                  </p>
                </div>
              </div>

              {/* Boolean Flags */}
              <div className="p-2.5 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border">
                <span className="text-xs font-semibold text-slate-700 dark:text-jb-text block mb-2">Boolean Properties</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(element.properties).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-jb-elevated border border-slate-200 dark:border-jb-border">
                      <span className="text-slate-500 dark:text-jb-textMuted font-mono text-[11px]">{key.replace(/^is/, '')}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        val
                          ? 'bg-emerald-100 dark:bg-[#1E3326] text-emerald-700 dark:text-jb-success'
                          : 'bg-slate-100 dark:bg-jb-hover text-slate-400 dark:text-jb-textMuted'
                      }`}>
                        {val ? 'true' : 'false'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-jb-textMuted">
                Copy ready-to-use locators for automated testing and scraping scripts.
              </p>

              {selectors.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-900 dark:bg-jb-bg text-slate-100 dark:text-jb-text font-mono text-xs border border-slate-800 dark:border-jb-border">
                  <div className="flex items-center justify-between mb-1 text-slate-400 dark:text-jb-textMuted font-sans">
                    <span className="text-[11px] font-medium text-jb-accent">{item.framework} • {item.label}</span>
                    <button
                      onClick={() => copyToClipboard(item.code, idx)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 dark:bg-jb-panel hover:bg-slate-700 dark:hover:bg-jb-hover text-slate-300 dark:text-jb-text text-[11px] border border-transparent dark:border-jb-border transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-jb-success" />
                          <span className="text-jb-success">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-emerald-300 dark:text-jb-success whitespace-pre-wrap break-all">{item.code}</pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="space-y-3">
              {/* Tap button */}
              <button
                onClick={handleTap}
                disabled={isExecuting || !deviceId}
                className="w-full py-2.5 px-4 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-400 dark:disabled:bg-jb-panel text-white font-medium flex items-center justify-center gap-2 shadow-xs transition-all text-xs"
              >
                <Touchpad className="w-4 h-4" />
                Tap Center ({Math.round((element.x1 + element.x2) / 2)}, {Math.round((element.y1 + element.y2) / 2)})
              </button>

              {/* Text Input */}
              <div className="p-3 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-jb-text block">
                  Send Text (Focuses & Types)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="Enter text to type..."
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-jb-border bg-white dark:bg-jb-elevated text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent"
                  />
                  <button
                    onClick={handleSendText}
                    disabled={isExecuting || !textInput.trim() || !deviceId}
                    className="px-3.5 py-1.5 rounded bg-jb-accent hover:bg-[#2F65D4] disabled:bg-slate-400 dark:disabled:bg-jb-elevated text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </div>

              {/* Hardware navigation keys */}
              <div className="p-3 rounded bg-slate-50 dark:bg-jb-panel border border-slate-200 dark:border-jb-border space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-jb-text block">Hardware Keys</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  <button
                    onClick={() => handleKey('KEYCODE_BACK')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-jb-border text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-jb-accent" />
                    Back
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_HOME')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-jb-border text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-jb-accent" />
                    Home
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_ENTER')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 text-jb-success" />
                    Enter
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_DEL')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <Delete className="w-3.5 h-3.5 text-jb-error" />
                    Backspace
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_APP_SWITCH')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-jb-accent" />
                    Recents
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_MENU')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded bg-white dark:bg-jb-elevated hover:bg-slate-100 dark:hover:bg-jb-hover border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-jb-text flex flex-col items-center gap-1 transition-colors"
                  >
                    <Menu className="w-3.5 h-3.5 text-slate-500 dark:text-jb-textMuted" />
                    Menu
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {actionStatus && (
                <div className={`p-2.5 rounded text-xs font-medium border ${
                  actionStatus.success
                    ? 'bg-emerald-50 dark:bg-[#1E3326] text-emerald-800 dark:text-jb-success border-emerald-200 dark:border-[#2B543A]'
                    : 'bg-rose-50 dark:bg-[#351E20] text-rose-800 dark:text-jb-error border-rose-200 dark:border-[#52282C]'
                }`}>
                  {actionStatus.msg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seta Direita (Próximo Elemento) */}
      <button
        onClick={goToNext}
        disabled={!hasNext}
        className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 ml-2 sm:ml-3 rounded-full bg-white/95 dark:bg-jb-panel/95 hover:bg-white dark:hover:bg-jb-elevated text-slate-700 dark:text-jb-text border border-slate-200 dark:border-jb-border shadow-2xl transition-all shrink-0 ${
          hasNext
            ? 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer text-jb-accent hover:border-jb-accent ring-1 ring-jb-accent/30'
            : 'opacity-20 cursor-not-allowed'
        }`}
        title="Próximo Elemento (Seta Direita)"
      >
        <ChevronRight className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
