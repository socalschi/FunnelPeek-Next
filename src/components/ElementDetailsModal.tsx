import React, { useState } from 'react';
import { X, Touchpad, Copy, Check, Terminal, Send, ArrowLeft, Home, CornerDownLeft, Delete, Menu, Layers } from 'lucide-react';
import { UIElement } from '../types/index.ts';
import { generateSelectors } from '../utils/xmlParser.ts';

interface ElementDetailsModalProps {
  element: UIElement | null;
  deviceId: string | null;
  onClose: () => void;
  onRefreshAfterAction?: () => void;
}

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({
  element,
  deviceId,
  onClose,
  onRefreshAfterAction
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'automation' | 'interaction'>('properties');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ success: boolean; msg: string } | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                &lt;{element.tagName}&gt;
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {element.resourceId?.split('/').pop() || element.className.split('.').pop() || 'Element Details'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{element.bounds}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 text-xs">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Attributes & Properties
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'automation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Automation Selectors
          </button>
          <button
            onClick={() => setActiveTab('interaction')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'interaction'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Remote Control & Actions
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'properties' && (
            <div className="space-y-4">
              {/* String Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Resource ID</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 font-semibold break-all mt-1">
                    {element.resourceId || 'None'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Text</span>
                  <p className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                    {element.text ? `"${element.text}"` : 'None'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Class Name</span>
                  <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold break-all mt-1">
                    {element.className || 'None'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Content Description</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-1">
                    {element.contentDesc || 'None'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Package</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-1">{element.package || 'None'}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Dimensions & Center</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-1">
                    {element.width}×{element.height} px (Center: {Math.round((element.x1 + element.x2) / 2)}, {Math.round((element.y1 + element.y2) / 2)})
                  </p>
                </div>
              </div>

              {/* Boolean Flags */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Boolean Properties</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(element.properties).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-mono text-[11px]">{key.replace(/^is/, '')}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        val
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
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
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Copy ready-to-use locators for automated testing and scraping scripts.
              </p>

              {selectors.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5 text-slate-400 font-sans">
                    <span className="text-[11px] font-medium text-blue-400">{item.framework} • {item.label}</span>
                    <button
                      onClick={() => copyToClipboard(item.code, idx)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-emerald-300 whitespace-pre-wrap break-all">{item.code}</pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="space-y-4">
              {/* Tap button */}
              <button
                onClick={handleTap}
                disabled={isExecuting || !deviceId}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all text-sm"
              >
                <Touchpad className="w-4 h-4" />
                Tap This Element Center ({Math.round((element.x1 + element.x2) / 2)}, {Math.round((element.y1 + element.y2) / 2)})
              </button>

              {/* Text Input */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Send Text (Focuses & Types)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="Enter text to type..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendText}
                    disabled={isExecuting || !textInput.trim() || !deviceId}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </div>

              {/* Hardware navigation keys */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Hardware Keys</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    onClick={() => handleKey('KEYCODE_BACK')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
                    Back
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_HOME')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-amber-500" />
                    Home
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_ENTER')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                    Enter
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_DEL')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <Delete className="w-3.5 h-3.5 text-rose-500" />
                    Backspace
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_APP_SWITCH')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    Recents
                  </button>
                  <button
                    onClick={() => handleKey('KEYCODE_MENU')}
                    disabled={isExecuting || !deviceId}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
                  >
                    <Menu className="w-3.5 h-3.5 text-slate-500" />
                    Menu
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {actionStatus && (
                <div className={`p-3 rounded-lg text-xs font-medium ${
                  actionStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {actionStatus.msg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
