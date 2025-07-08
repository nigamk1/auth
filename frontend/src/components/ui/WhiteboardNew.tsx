import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PencilIcon, TrashIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { WhiteboardState } from '../../types';

interface WhiteboardProps {
  state: WhiteboardState | null;
  onUpdate: (state: WhiteboardState) => void;
  sessionId: string;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'text';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ state, onUpdate }) => {
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'text'>('pen');
  const [elements, setElements] = useState<DrawingElement[]>(state?.elements || []);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Update elements when state changes
  useEffect(() => {
    if (state?.elements) {
      setElements(state.elements);
    }
  }, [state]);

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [elements]);

  // Save to history
  const saveToHistory = useCallback((newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  // Update whiteboard state
  const updateWhiteboardState = useCallback((newElements: DrawingElement[]) => {
    const newState: WhiteboardState = {
      elements: newElements,
      version: (state?.version || 0) + 1,
      lastModified: new Date(),
      metadata: {
        totalElements: newElements.length,
        canvasSize: { width: 800, height: 600 },
        backgroundColor: '#ffffff'
      }
    };
    onUpdate(newState);
  }, [state, onUpdate]);

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all elements
    elements.forEach(element => {
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (element.type) {
        case 'line':
          if (element.points && element.points.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(element.points[0], element.points[1]);
            for (let i = 2; i < element.points.length; i += 2) {
              ctx.lineTo(element.points[i], element.points[i + 1]);
            }
            ctx.stroke();
          }
          break;
        
        case 'rect':
          if (element.x !== undefined && element.y !== undefined && element.width && element.height) {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          break;
        
        case 'circle':
          if (element.x !== undefined && element.y !== undefined && element.width) {
            ctx.beginPath();
            ctx.arc(element.x + element.width / 2, element.y + element.width / 2, element.width / 2, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        
        case 'text':
          if (element.x !== undefined && element.y !== undefined && element.text) {
            ctx.fillStyle = element.fill || element.stroke;
            ctx.font = '16px Arial';
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
      }
    });
  };

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const pos = getMousePos(e);
      const text = prompt('Enter text:');
      
      if (text) {
        const newElement: DrawingElement = {
          id: `text-${Date.now()}-${Math.random()}`,
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          stroke: strokeColor,
          strokeWidth: 1,
          fill: strokeColor,
        };

        const newElements = [...elements, newElement];
        setElements(newElements);
        saveToHistory(newElements);
        updateWhiteboardState(newElements);
      }
      return;
    }

    isDrawingRef.current = true;
    setIsDrawing(true);
    
    const pos = getMousePos(e);
    lastPointRef.current = pos;

    const newElement: DrawingElement = {
      id: `element-${Date.now()}-${Math.random()}`,
      type: tool === 'pen' || tool === 'eraser' ? 'line' : tool,
      stroke: tool === 'eraser' ? '#FFFFFF' : strokeColor,
      strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
      points: tool === 'pen' || tool === 'eraser' ? [pos.x, pos.y] : undefined,
      x: tool !== 'pen' && tool !== 'eraser' ? pos.x : undefined,
      y: tool !== 'pen' && tool !== 'eraser' ? pos.y : undefined,
      width: tool === 'rect' || tool === 'circle' ? 0 : undefined,
      height: tool === 'rect' ? 0 : undefined,
    };

    setElements(prev => [...prev, newElement]);
  }, [tool, strokeColor, strokeWidth, elements, saveToHistory, updateWhiteboardState]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const pos = getMousePos(e);

    setElements(prev => {
      const newElements = [...prev];
      const lastElement = { ...newElements[newElements.length - 1] };

      if (tool === 'pen' || tool === 'eraser') {
        lastElement.points = [...(lastElement.points || []), pos.x, pos.y];
      } else if (tool === 'rect') {
        lastElement.width = pos.x - lastElement.x!;
        lastElement.height = pos.y - lastElement.y!;
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pos.x - lastElement.x!, 2) + Math.pow(pos.y - lastElement.y!, 2)
        );
        lastElement.width = radius * 2;
        lastElement.height = radius * 2;
        lastElement.x = lastElement.x! - radius;
        lastElement.y = lastElement.y! - radius;
      }

      newElements[newElements.length - 1] = lastElement;
      return newElements;
    });
  }, [tool]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;
    
    saveToHistory(elements);
    updateWhiteboardState(elements);
  }, [elements, saveToHistory, updateWhiteboardState]);

  // Clear whiteboard
  const clearWhiteboard = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the whiteboard?')) {
      setElements([]);
      saveToHistory([]);
      updateWhiteboardState([]);
    }
  }, [saveToHistory, updateWhiteboardState]);

  // Undo
  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const newElements = history[newStep];
      setHistoryStep(newStep);
      setElements(newElements);
      updateWhiteboardState(newElements);
    }
  }, [history, historyStep, updateWhiteboardState]);

  // Redo
  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const newElements = history[newStep];
      setHistoryStep(newStep);
      setElements(newElements);
      updateWhiteboardState(newElements);
    }
  }, [history, historyStep, updateWhiteboardState]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title="Pen"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title="Eraser"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`p-2 rounded ${tool === 'rect' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title="Rectangle"
            >
              <div className="w-4 h-4 border border-current"></div>
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title="Circle"
            >
              <div className="w-4 h-4 border border-current rounded-full"></div>
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title="Text"
            >
              <span className="text-sm font-bold">T</span>
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2 mr-4">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300"
            />
          </div>

          {/* Stroke Width */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-6">{strokeWidth}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <ArrowUturnRightIcon className="w-4 h-4" />
          </button>
          <button
            onClick={clearWhiteboard}
            className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
            title="Clear All"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-200 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Elements: {elements.length} | Tool: {tool} | 
        {state && ` Version: ${state.version}`}
        {isDrawing && ' | Drawing...'}
      </div>
    </div>
  );
};

export default Whiteboard;
