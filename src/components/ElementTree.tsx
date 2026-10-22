import React, { useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Code, FileText, CornerDownRight } from 'lucide-react';
import { UIElement } from '../types/index.ts';

interface ElementTreeProps {
  rootElements: UIElement[];
  filteredElements: UIElement[];
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchMode: 'text' | 'xpath';
  setSearchMode: (mode: 'text' | 'xpath') => void;
  highlightedElementId: string | null;
  selectedElementId: string | null;
  onElementHover: (id: string | null) => void;
  onElementSelect: (id: string | null) => void;
  onElementDoubleClick: (id: string) => void;
}

export const ElementTree: React.FC<ElementTreeProps> = ({
  rootElements,
  filteredElements,
  isSearching,
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
  highlightedElementId,
  selectedElementId,
  onElementHover,
  onElementSelect,
  onElementDoubleClick
}) => {
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to highlighted/selected element
  useEffect(() => {
    const targetId = selectedElementId || highlightedElementId;
    if (targetId && itemRefs.current[targetId]) {
      itemRefs.current[targetId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedElementId, selectedElementId]);

  const renderNode = (element: UIElement, depth = 0): React.ReactNode => {
    const isSelected = element.id === selectedElementId;
    const isHighlighted = element.id === highlightedElementId;
    const hasChildren = element.children && element.children.length > 0;

    return (
      <div key={element.id} className="select-none font-mono text-xs">
        <div
          ref={(el) => { itemRefs.current[element.id] = el; }}
          onClick={() => onElementSelect(element.id)}
          onDoubleClick={() => onElementDoubleClick(element.id)}
          onMouseEnter={() => onElementHover(element.id)}
          onMouseLeave={() => onElementHover(null)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors border-l-2 ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-500 font-medium'
              : isHighlighted
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-500'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300'
          }`}
        >
          {hasChildren ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 shrink-0" />
          )}

          {/* Node Tag & Class */}
          <span className="text-blue-600 dark:text-blue-400 font-semibold">&lt;{element.tagName}</span>

          {element.className && (
            <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
              .{element.className.split('.').pop()}
            </span>
          )}

          {/* Text preview */}
          {element.text && (
            <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded truncate max-w-[120px]">
              "{element.text}"
            </span>
          )}

          {/* Resource ID preview */}
          {element.resourceId && !element.text && (
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
              #{element.resourceId.split('/').pop()}
            </span>
          )}

          {/* Bounds */}
          <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-auto shrink-0">
            {element.bounds}
          </span>

          <span className="text-blue-600 dark:text-blue-400">&gt;</span>
        </div>

        {/* Children */}
        {hasChildren && element.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Search Bar Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchMode === 'xpath' ? 'XPath query (e.g. //*[@clickable="true"])' : 'Filter by tag, ID, class, text...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setSearchMode('text')}
              className={`px-2 py-1 rounded-md transition-colors ${searchMode === 'text' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Text
            </button>
            <button
              onClick={() => setSearchMode('xpath')}
              className={`px-2 py-1 rounded-md transition-colors ${searchMode === 'xpath' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              XPath
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-2">
        {rootElements.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <FileText className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs">Hierarchy tree is empty.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Capture a device screen to inspect the hierarchy.</p>
          </div>
        ) : isSearching ? (
          <div>
            <div className="text-[11px] text-slate-400 mb-2 px-2 flex items-center justify-between">
              <span>Matches: {filteredElements.length}</span>
            </div>
            {filteredElements.map(el => (
              <div
                key={el.id}
                onClick={() => onElementSelect(el.id)}
                onDoubleClick={() => onElementDoubleClick(el.id)}
                onMouseEnter={() => onElementHover(el.id)}
                onMouseLeave={() => onElementHover(null)}
                className={`p-2 rounded-lg mb-1 cursor-pointer font-mono text-xs border ${
                  el.id === selectedElementId
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold">
                  <span>&lt;{el.tagName}&gt;</span>
                  <span className="text-[10px] text-slate-400">{el.bounds}</span>
                </div>
                {el.resourceId && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">ID: {el.resourceId}</p>}
                {el.text && <p className="text-amber-600 dark:text-amber-400 text-[11px] mt-0.5 font-sans">"{el.text}"</p>}
              </div>
            ))}
          </div>
        ) : (
          rootElements.map(root => renderNode(root))
        )}
      </div>
    </div>
  );
};
