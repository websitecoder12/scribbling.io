'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Undo2, RotateCcw, Paintbrush, Eraser } from 'lucide-react';

interface DrawingCanvasProps {
  blindMode?: boolean;
  onCanvasSubmit?: (base64Data: string) => void;
  readOnly?: boolean;
  initialImageData?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF9500', 
  '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', 
  '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', 
  '#FF2D55', '#A2845E'
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  blindMode = false,
  readOnly = false,
  initialImageData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  
  const undoStackRef = useRef<ImageData[]>([]);
  const MAX_UNDO_DEPTH = 25;

  const [isFaded, setIsFaded] = useState<boolean>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let savedData: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      savedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (savedData) {
      ctx.putImageData(savedData, 0, 0);
    } else if (initialImageData) {
      const img = new Image();
      img.src = initialImageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        saveState();
      };
    } else {
      saveState();
    }
  }, [initialImageData]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);

    if (undoStackRef.current.length > MAX_UNDO_DEPTH) {
      undoStackRef.current.shift();
    }
  };

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    undoStackRef.current.pop();
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    ctx.putImageData(previousState, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const resetInactivityTimer = () => {
    if (!blindMode) return;
    setIsFaded(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = setTimeout(() => {
      setIsFaded(true);
    }, 3000);
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    resetInactivityTimer();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : brushColor;
    ctx.lineWidth = brushSize;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    resetInactivityTimer();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    resetInactivityTimer();
    saveState();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto p-4">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/50 touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-full h-full cursor-crosshair transition-opacity duration-1000 ${
            blindMode && isFaded ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {blindMode && isFaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-none transition-opacity duration-500">
            <span className="text-white text-lg font-bold tracking-wider uppercase bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              🙈 Blind Drawing Active (Move cursor to draw)
            </span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-2.5 rounded-xl transition-all ${
                !isEraser ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Paintbrush className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-2.5 rounded-xl transition-all ${
                isEraser ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleUndo}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all active:scale-95"
            >
              <Undo2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setBrushColor(color);
                  setIsEraser(false);
                }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  brushColor === color && !isEraser ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={brushColor}
              onChange={(e) => {
                setBrushColor(e.target.value);
                setIsEraser(false);
              }}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
          </div>

          <div className="flex items-center gap-3 min-w-[140px]">
            <span className="text-xs text-slate-400 font-medium uppercase">Size</span>
            <input
              type="range"
              min="2"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};