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
              ? 'bg-blue-100 dark:bg-jb-accentHover text-blue-900 dark:text-white border-jb-accent font-medium'
              : isHighlighted
              ? 'bg-blue-50 dark:bg-jb-hover text-slate-900 dark:text-white border-[#56A8F5]'
              : 'hover:bg-slate-100 dark:hover:bg-jb-hover border-transparent text-slate-700 dark:text-jb-text'
          }`}
        >
          {hasChildren ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-jb-textMuted shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 shrink-0" />
          )}

          {/* Node Tag & Class */}
          <span className="text-blue-600 dark:text-jb-accent font-semibold">&lt;{element.tagName}</span>

          {element.className && (
            <span className="text-emerald-600 dark:text-jb-success truncate max-w-[130px]">
              .{element.className.split('.').pop()}
            </span>
          )}

          {/* Text preview - Clean IntelliJ string green on subtle elevated background, no brown or yellow */}
          {element.text && (
            <span className="text-emerald-700 dark:text-[#6AAB73] bg-slate-100 dark:bg-jb-elevated border border-slate-200 dark:border-jb-border px-1.5 py-0.2 rounded font-sans truncate max-w-[130px]" title={element.text}>
              "{element.text}"
            </span>
          )}

          {/* Resource ID preview */}
          {element.resourceId && !element.text && (
            <span className="text-slate-500 dark:text-jb-textMuted truncate max-w-[100px]">
              #{element.resourceId.split('/').pop()}
            </span>
          )}

          {/* Bounds */}
          <span className="text-slate-400 dark:text-jb-textMuted text-[10px] ml-auto shrink-0 font-mono">
            {element.bounds}
          </span>

          <span className="text-blue-600 dark:text-jb-accent">&gt;</span>
        </div>

        {/* Children */}
        {hasChildren && element.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-jb-panel rounded border border-slate-200 dark:border-jb-border overflow-hidden shadow-xs">
      {/* Search Bar Header */}
      <div className="p-2.5 border-b border-slate-200 dark:border-jb-border bg-slate-50 dark:bg-jb-panel space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-jb-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchMode === 'xpath' ? 'XPath query (e.g. //*[@clickable="true"])' : 'Filter by tag, ID, class, text...'}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-jb-elevated border border-slate-200 dark:border-jb-border rounded text-slate-900 dark:text-jb-text placeholder-slate-400 dark:placeholder-jb-textMuted focus:outline-none focus:ring-1 focus:ring-jb-accent"
            />
          </div>

          <div className="flex bg-slate-200 dark:bg-jb-bg p-0.5 rounded text-[11px]">
            <button
              onClick={() => setSearchMode('text')}
              className={`px-2 py-0.5 rounded transition-colors ${searchMode === 'text' ? 'bg-white dark:bg-jb-elevated text-blue-600 dark:text-jb-text shadow-xs font-medium' : 'text-slate-500 dark:text-jb-textMuted hover:text-slate-900 dark:hover:text-jb-text'}`}
            >
              Text
            </button>
            <button
              onClick={() => setSearchMode('xpath')}
              className={`px-2 py-0.5 rounded transition-colors ${searchMode === 'xpath' ? 'bg-white dark:bg-jb-elevated text-blue-600 dark:text-jb-text shadow-xs font-medium' : 'text-slate-500 dark:text-jb-textMuted hover:text-slate-900 dark:hover:text-jb-text'}`}
            >
              XPath
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-1.5">
        {rootElements.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-jb-textMuted p-4 text-center">
            <FileText className="w-7 h-7 stroke-1 text-slate-300 dark:text-jb-borderStrong mb-2" />
            <p className="text-xs text-slate-600 dark:text-jb-text">Hierarchy tree is empty.</p>
            <p className="text-[11px] text-slate-400 dark:text-jb-textMuted mt-0.5">Capture a device screen to inspect the hierarchy.</p>
          </div>
        ) : isSearching ? (
          <div>
            <div className="text-[11px] text-slate-400 dark:text-jb-textMuted mb-1.5 px-2 flex items-center justify-between">
              <span>Matches: {filteredElements.length}</span>
            </div>
            {filteredElements.map(el => (
              <div
                key={el.id}
                onClick={() => onElementSelect(el.id)}
                onDoubleClick={() => onElementDoubleClick(el.id)}
                onMouseEnter={() => onElementHover(el.id)}
                onMouseLeave={() => onElementHover(null)}
                className={`p-2 rounded mb-1 cursor-pointer font-mono text-xs border ${
                  el.id === selectedElementId
                    ? 'bg-blue-50 dark:bg-jb-accentHover border-jb-accent'
                    : 'bg-slate-50 dark:bg-jb-elevated/40 border-slate-200 dark:border-jb-border hover:border-jb-borderStrong'
                }`}
              >
                <div className="flex items-center justify-between text-blue-600 dark:text-jb-accent font-semibold">
                  <span>&lt;{el.tagName}&gt;</span>
                  <span className="text-[10px] text-slate-400 dark:text-jb-textMuted">{el.bounds}</span>
                </div>
                {el.resourceId && <p className="text-slate-500 dark:text-jb-textMuted text-[11px] mt-0.5">ID: {el.resourceId}</p>}
                {el.text && <p className="text-emerald-700 dark:text-[#6AAB73] text-[11px] mt-0.5 font-sans">"{el.text}"</p>}
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
