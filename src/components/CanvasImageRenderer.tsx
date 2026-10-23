import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid, Eye } from 'lucide-react';
import { UIElement } from '../types/index.ts';

interface CanvasImageRendererProps {
  base64Image: string | null;
  elements: UIElement[];
  highlightedElementId: string | null;
  selectedElementId: string | null;
  showAllRectangles: boolean;
  setShowAllRectangles: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  onElementHover: (elementId: string | null) => void;
  onElementClick: (elementId: string | null) => void;
  onElementDoubleClick: (elementId: string) => void;
}

export const CanvasImageRenderer: React.FC<CanvasImageRendererProps> = ({
  base64Image,
  elements,
  highlightedElementId,
  selectedElementId,
  showAllRectangles,
  setShowAllRectangles,
  showGrid,
  setShowGrid,
  onElementHover,
  onElementClick,
  onElementDoubleClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{ imgX: number; imgY: number } | null>(null);

  // Load image when base64 changes
  useEffect(() => {
    if (!base64Image) {
      setImageLoaded(false);
      imageRef.current = null;
      return;
    }

    const img = new Image();
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);

      // Fit to container initially
      if (containerRef.current && canvasRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw > 0 && ch > 0) {
          canvasRef.current.width = cw;
          canvasRef.current.height = ch;

          const pad = 32;
          const availW = Math.max(cw - pad * 2, 40);
          const availH = Math.max(ch - pad * 2, 40);
          const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight, 1);
          const finalZoom = scale > 0 ? scale : 1;

          setZoom(finalZoom);
          setPanOffset({
            x: Math.round((cw - img.naturalWidth * finalZoom) / 2),
            y: Math.round((ch - img.naturalHeight * finalZoom) / 2)
          });
        }
      }
    };
  }, [base64Image]);

  // Redraw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !imageLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw background image
    ctx.drawImage(img, 0, 0);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1 / zoom;
      const step = 50;
      for (let x = 0; x <= img.naturalWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, img.naturalHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= img.naturalHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(img.naturalWidth, y);
        ctx.stroke();
      }
    }

    // Draw bounding boxes
    elements.forEach(el => {
      const isHighlighted = el.id === highlightedElementId;
      const isSelected = el.id === selectedElementId;

      if (!showAllRectangles && !isHighlighted && !isSelected) {
        return;
      }

      ctx.save();
      if (isSelected) {
        ctx.strokeStyle = '#3574F0'; // IntelliJ accent / focus
        ctx.fillStyle = 'rgba(53, 116, 240, 0.20)';
        ctx.lineWidth = 2.5 / zoom;
      } else if (isHighlighted) {
        ctx.strokeStyle = '#56A8F5'; // Clean light blue for hover - NO yellow
        ctx.fillStyle = 'rgba(86, 168, 245, 0.12)';
        ctx.lineWidth = 2 / zoom;
      } else {
        ctx.strokeStyle = 'rgba(78, 81, 87, 0.6)'; // subtle divider outline
        ctx.fillStyle = 'rgba(78, 81, 87, 0.05)';
        ctx.lineWidth = 1 / zoom;
      }

      ctx.fillRect(el.x1, el.y1, el.width, el.height);
      ctx.strokeRect(el.x1, el.y1, el.width, el.height);

      // Label on selected or highlighted
      if (isSelected || isHighlighted) {
        const label = el.text ? `"${el.text.slice(0, 18)}"` : (el.resourceId?.split('/').pop() || el.tagName);
        const fontSize = Math.max(11 / zoom, 10);
        ctx.font = `${fontSize}px monospace`;
        const textMetrics = ctx.measureText(label);
        const boxHeight = 17 / zoom;
        const boxWidth = textMetrics.width + 8 / zoom;
        const boxX = el.x1;
        const boxY = Math.max(0, el.y1 - boxHeight - 2 / zoom);

        if (isSelected) {
          ctx.fillStyle = '#3574F0'; // Solid active accent
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          ctx.fillStyle = '#FFFFFF'; // Crisp white text
        } else {
          ctx.fillStyle = '#2B2D30'; // IntelliJ Panel surface
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          ctx.strokeStyle = '#56A8F5'; // Fine subtle light blue border
          ctx.lineWidth = 1 / zoom;
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
          ctx.fillStyle = '#BCBEC4'; // IntelliJ primary text
        }

        ctx.fillText(label, boxX + 4 / zoom, boxY + boxHeight - 4 / zoom);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [imageLoaded, zoom, panOffset, elements, highlightedElementId, selectedElementId, showAllRectangles, showGrid]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Sync canvas size with container via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      if (cw > 0 && ch > 0) {
        if (canvasRef.current.width !== cw || canvasRef.current.height !== ch) {
          canvasRef.current.width = cw;
          canvasRef.current.height = ch;
          draw();
        }
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    observer.observe(container);
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [draw]);

  // Coordinate conversion: Screen/Mouse -> Image coordinates
  const screenToImage = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const imgX = (mouseX - panOffset.x) / zoom;
    const imgY = (mouseY - panOffset.y) / zoom;
    return { x: imgX, y: imgY };
  };

  // Find topmost element under image coordinates
  const findElementAt = (imgX: number, imgY: number): UIElement | null => {
    if (imgX < 0 || imgX > imageDimensions.width || imgY < 0 || imgY > imageDimensions.height) {
      return null;
    }

    // Traverse elements in reverse order (children usually come later/deeper)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (imgX >= el.x1 && imgX <= el.x2 && imgY >= el.y1 && imgY <= el.y2) {
        return el;
      }
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.altKey) {
      // Alt + Click = pan
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    } else if (e.button === 1 || e.button === 2) {
      // Middle or right click = pan
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    } else if (e.button === 0) {
      // Left click = element select
      const { x, y } = screenToImage(e.clientX, e.clientY);
      const hit = findElementAt(x, y);
      onElementClick(hit ? hit.id : null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const { x, y } = screenToImage(e.clientX, e.clientY);
    setMousePos({ imgX: Math.round(x), imgY: Math.round(y) });

    const hit = findElementAt(x, y);
    onElementHover(hit ? hit.id : null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 10);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered on mouse cursor
    const newOffsetX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
    const newOffsetY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPanOffset({ x: newOffsetX, y: newOffsetY });
  };

  const fitToScreen = () => {
    if (!containerRef.current || !canvasRef.current || !imageRef.current) return;
    const img = imageRef.current;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (cw <= 0 || ch <= 0) return;

    canvasRef.current.width = cw;
    canvasRef.current.height = ch;

    const pad = 32;
    const availW = Math.max(cw - pad * 2, 40);
    const availH = Math.max(ch - pad * 2, 40);
    const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight, 1);
    const finalZoom = scale > 0 ? scale : 1;

    setZoom(finalZoom);
    setPanOffset({
      x: Math.round((cw - img.naturalWidth * finalZoom) / 2),
      y: Math.round((ch - img.naturalHeight * finalZoom) / 2)
    });
  };

  const resetZoom = () => {
    if (!containerRef.current || !canvasRef.current || !imageRef.current) return;
    const img = imageRef.current;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (cw <= 0 || ch <= 0) return;

    canvasRef.current.width = cw;
    canvasRef.current.height = ch;

    setZoom(1);
    setPanOffset({
      x: Math.round((cw - img.naturalWidth) / 2),
      y: Math.round((ch - img.naturalHeight) / 2)
    });
  };

  return (
    <div className="relative flex-1 h-full min-h-0 min-w-0 bg-slate-100 dark:bg-jb-bg rounded overflow-hidden flex flex-col border border-slate-200 dark:border-jb-border shadow-xs transition-colors">
      {/* Floating Canvas Controls */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 p-1 bg-white/95 dark:bg-jb-panel/95 backdrop-blur-md border border-slate-200 dark:border-jb-border rounded text-slate-700 dark:text-jb-text shadow-sm transition-colors select-none">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.25, 10))}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z * 0.8, 0.1))}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetZoom}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover transition-colors"
          title="Reset Zoom (100%)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-jb-border mx-0.5" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1 rounded transition-colors ${showGrid ? 'bg-jb-accent text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-jb-hover'}`}
          title="Toggle Grid Overlay"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowAllRectangles(!showAllRectangles)}
          className={`p-1 rounded transition-colors ${showAllRectangles ? 'bg-jb-accent text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-jb-hover'}`}
          title="Highlight All Bounding Boxes"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono px-1.5 text-slate-500 dark:text-jb-textMuted">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Coordinate & Dimensions Pill at Bottom */}
      {mousePos && (
        <div className="absolute bottom-2.5 left-2.5 z-20 px-2 py-0.5 bg-white/95 dark:bg-jb-panel/95 backdrop-blur-md border border-slate-200 dark:border-jb-border rounded text-[11px] font-mono text-slate-700 dark:text-jb-text shadow-xs transition-colors">
          X: {mousePos.imgX} | Y: {mousePos.imgY} ({imageDimensions.width}×{imageDimensions.height})
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-crosshair select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={(e) => {
          const { x, y } = screenToImage(e.clientX, e.clientY);
          const hit = findElementAt(x, y);
          if (hit) onElementDoubleClick(hit.id);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {!base64Image && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-jb-textMuted p-6 text-center pointer-events-none">
            <p className="text-sm font-medium text-slate-600 dark:text-jb-text">Nenhuma tela inspecionada.</p>
            <p className="text-xs text-slate-400 dark:text-jb-textMuted mt-1">
              Selecione o aparelho conectado e clique em "Inspect Screen" para analisar a UI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
