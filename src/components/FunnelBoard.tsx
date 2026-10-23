import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { UIElement } from '../types/index.ts';
import { parseHierarchyXml, filterElements, searchByXPath } from '../utils/xmlParser.ts';
import { CanvasImageRenderer } from './CanvasImageRenderer.tsx';
import { ElementTree } from './ElementTree.tsx';
import { ElementDetailsModal } from './ElementDetailsModal.tsx';

interface FunnelBoardProps {
  selectedDevice: string | null;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  uiHierarchyXml: string;
  setUiHierarchyXml: (xml: string) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  highlightedElementId: string | null;
  setHighlightedElementId: (id: string | null) => void;
  isSecuredScreen: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  onInspect: () => Promise<void>;
}

export const FunnelBoard: React.FC<FunnelBoardProps> = ({
  selectedDevice,
  capturedImage,
  setCapturedImage,
  uiHierarchyXml,
  setUiHierarchyXml,
  selectedElementId,
  setSelectedElementId,
  highlightedElementId,
  setHighlightedElementId,
  isSecuredScreen,
  errorMessage,
  setErrorMessage,
  onInspect
}) => {
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

  return (
    <div className="h-full flex flex-col w-full min-h-0 space-y-2">
      {/* Security alert if screen is black/secured */}
      {isSecuredScreen && (
        <div className="p-2 rounded bg-blue-50 dark:bg-jb-elevated border border-blue-200 dark:border-jb-border text-xs text-blue-900 dark:text-jb-text flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-jb-accent shrink-0" />
          <span>Tela com proteção (FLAG_SECURE ou bloqueada). A árvore hierárquica XML ainda foi inspecionada!</span>
        </div>
      )}

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-2 rounded bg-rose-50 dark:bg-[#351E20] border border-rose-200 dark:border-jb-error/40 text-xs text-rose-800 dark:text-jb-error flex items-center justify-between gap-2 shadow-xs shrink-0">
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
          onRefreshAfterAction={onInspect}
        />
      )}
    </div>
  );
};
