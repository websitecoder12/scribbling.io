'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, RotateCcw } from 'lucide-react';

interface CanvasProps {
  onAutoSubmit: (imageData: string) => void;
  isTimeUp: boolean;
}

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const SIZES = [2, 6, 12, 24];

export default function Canvas({ onAutoSubmit, isTimeUp }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (isTimeUp && canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      onAutoSubmit(imageData);
    }
  }, [isTimeUp, onAutoSubmit]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800">
      <div className="relative border-4 border-gray-700 rounded-xl overflow-hidden shadow-2xl bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          className="cursor-crosshair touch-none"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between w-full max-w-[700px] gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('brush'); }}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c && tool === 'brush' ? 'border-white scale-110 ring-2 ring-indigo-500' : 'border-gray-600'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 border-l border-r border-gray-700 px-4">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700 text-white ${
                brushSize === size ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'hover:bg-gray-600'
              }`}
            >
              <div style={{ width: `${Math.min(size, 18)}px`, height: `${Math.min(size, 18)}px` }} className="bg-white rounded-full" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTool('brush')} className={`p-2 rounded-lg text-white ${tool === 'brush' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
            <Paintbrush className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg text-white ${tool === 'eraser' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
            <Eraser className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
