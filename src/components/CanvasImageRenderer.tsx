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
      return;
    }

    const img = new Image();
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
      // Fit to container initially
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const scale = Math.min((cw - 40) / img.naturalWidth, (ch - 40) / img.naturalHeight, 1);
        setZoom(scale > 0 ? scale : 1);
        setPanOffset({
          x: (cw - img.naturalWidth * scale) / 2,
          y: (ch - img.naturalHeight * scale) / 2
        });
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
        ctx.strokeStyle = '#2563eb'; // blue-600
        ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
        ctx.lineWidth = 3 / zoom;
      } else if (isHighlighted) {
        ctx.strokeStyle = '#eab308'; // yellow-500
        ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';
        ctx.lineWidth = 2.5 / zoom;
      } else {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // red-500 transparent
        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.lineWidth = 1 / zoom;
      }

      ctx.fillRect(el.x1, el.y1, el.width, el.height);
      ctx.strokeRect(el.x1, el.y1, el.width, el.height);

      // Label on selected
      if (isSelected || isHighlighted) {
        const label = el.text ? `"${el.text.slice(0, 15)}"` : (el.resourceId?.split('/').pop() || el.tagName);
        ctx.font = `${Math.max(11 / zoom, 10)}px monospace`;
        ctx.fillStyle = isSelected ? '#1e3a8a' : '#713f12';
        ctx.fillRect(el.x1, Math.max(0, el.y1 - 18 / zoom), ctx.measureText(label).width + 6 / zoom, 16 / zoom);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, el.x1 + 3 / zoom, Math.max(12 / zoom, el.y1 - 5 / zoom));
      }

      ctx.restore();
    });

    ctx.restore();
  }, [imageLoaded, zoom, panOffset, elements, highlightedElementId, selectedElementId, showAllRectangles, showGrid]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Sync canvas size with container
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    if (!containerRef.current || !imageDimensions.width) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = Math.min((cw - 40) / imageDimensions.width, (ch - 40) / imageDimensions.height, 1);
    setZoom(scale);
    setPanOffset({
      x: (cw - imageDimensions.width * scale) / 2,
      y: (ch - imageDimensions.height * scale) / 2
    });
  };

  const resetZoom = () => {
    if (!containerRef.current || !imageDimensions.width) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    setZoom(1);
    setPanOffset({
      x: (cw - imageDimensions.width) / 2,
      y: (ch - imageDimensions.height) / 2
    });
  };

  return (
    <div className="relative flex-1 h-full min-h-[480px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {/* Floating Canvas Controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 shadow-md transition-colors">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.25, 10))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z * 0.8, 0.1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoom}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Reset Zoom (100%)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg transition-colors ${showGrid ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="Toggle Grid Overlay"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowAllRectangles(!showAllRectangles)}
          className={`p-1.5 rounded-lg transition-colors ${showAllRectangles ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          title="Highlight All Bounding Boxes"
        >
          <Eye className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono px-2 text-slate-500 dark:text-slate-400">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Coordinate & Dimensions Pill at Bottom */}
      {mousePos && (
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 shadow transition-colors">
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
        {!base64Image ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhuma tela inspecionada.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Selecione o aparelho conectado e clique em "Inspect Screen" para analisar a UI.</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full block" />
        )}
      </div>
    </div>
  );
};
