import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Arrow } from 'react-konva';
import { 
  Pen, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  ArrowRight, 
  Eraser, 
  Undo, 
  Redo, 
  Save, 
  Trash2
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
// import { useAuth } from '../../contexts/AuthContext'; // TODO: Use for author metadata

// Import types
import type { WhiteboardElement, WhiteboardState } from '../../types/ai-teacher';

interface AiWhiteboardProps {
  sessionId?: string;
  width?: number;
  height?: number;
  className?: string;
  readonly?: boolean;
  onElementAdded?: (element: WhiteboardElement) => void;
  onElementUpdated?: (element: WhiteboardElement) => void;
  onElementDeleted?: (elementId: string) => void;
  onStateChanged?: (state: WhiteboardState) => void;
}

type Tool = 'pen' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'eraser' | 'select';

interface DrawingElement extends Omit<WhiteboardElement, 'id' | 'timestamp' | 'author'> {
  id: string;
  isComplete: boolean;
}

export const AiWhiteboard: React.FC<AiWhiteboardProps> = ({
  sessionId = 'default',
  width = 1200,
  height = 800,
  className = '',
  readonly = false,
  onElementAdded,
  onElementUpdated,
  onStateChanged
}) => {
  // const { user } = useAuth(); // TODO: Use for author metadata
  const [tool, setTool] = useState<Tool>('pen');
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  // const [selectedElementId, setSelectedElementId] = useState<string | null>(null); // TODO: Implement selection
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasState] = useState({
    backgroundColor: '#ffffff',
    gridEnabled: true,
    zoom: 1,
    viewBox: { x: 0, y: 0, width, height }
  });
  const [strokeColor, setStrokeColor] = useState('#000000');
  // const [fillColor, setFillColor] = useState('transparent'); // TODO: Implement fill
  const [strokeWidth, setStrokeWidth] = useState(2);
  // const [fontSize, setFontSize] = useState(16); // TODO: Implement font size
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // Add element to history for undo/redo
  const addToHistory = useCallback((newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Generate unique element ID
  const generateElementId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle mouse/touch start
  const handleMouseDown = (e: any) => {
    if (readonly || tool === 'select') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const elementId = generateElementId();

    let newElement: DrawingElement | null = null;

    switch (tool) {
      case 'pen':
        newElement = {
          id: elementId,
          type: 'line',
          x: point.x,
          y: point.y,
          points: [point.x, point.y],
          properties: {
            stroke: strokeColor,
            strokeWidth,
            opacity: 1
          },
          zIndex: elements.length,
          isComplete: false
        };
        break;

      case 'rectangle':
        newElement = {
          id: elementId,
          type: 'rectangle',
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          properties: {
            stroke: strokeColor,
            fill: 'transparent',
            strokeWidth,
            opacity: 1
          },
          zIndex: elements.length,
          isComplete: false
        };
        break;

      case 'circle':
        newElement = {
          id: elementId,
          type: 'circle',
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          properties: {
            stroke: strokeColor,
            fill: 'transparent',
            strokeWidth,
            opacity: 1
          },
          zIndex: elements.length,
          isComplete: false
        };
        break;

      case 'text':
        newElement = {
          id: elementId,
          type: 'text',
          x: point.x,
          y: point.y,
          properties: {
            text: 'Double click to edit',
            fontSize: 16,
            fontFamily: 'Arial',
            fill: strokeColor,
            opacity: 1
          },
          zIndex: elements.length,
          isComplete: true
        };
        break;

      case 'arrow':
        newElement = {
          id: elementId,
          type: 'arrow',
          x: point.x,
          y: point.y,
          points: [point.x, point.y, point.x, point.y],
          properties: {
            stroke: strokeColor,
            strokeWidth,
            fill: strokeColor,
            opacity: 1
          },
          zIndex: elements.length,
          isComplete: false
        };
        break;
    }

    if (newElement) {
      setCurrentElement(newElement);
      setIsDrawing(true);
    }
  };

  // Handle mouse/touch move
  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentElement || readonly) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const updatedElement = { ...currentElement };

    switch (currentElement.type) {
      case 'line':
        if (updatedElement.points) {
          updatedElement.points = [...updatedElement.points, point.x, point.y];
        }
        break;

      case 'rectangle':
        updatedElement.width = point.x - updatedElement.x;
        updatedElement.height = point.y - updatedElement.y;
        break;

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(point.x - updatedElement.x, 2) + Math.pow(point.y - updatedElement.y, 2)
        );
        updatedElement.width = radius * 2;
        updatedElement.height = radius * 2;
        break;

      case 'arrow':
        if (updatedElement.points) {
          updatedElement.points = [
            updatedElement.x,
            updatedElement.y,
            point.x,
            point.y
          ];
        }
        break;
    }

    setCurrentElement(updatedElement);
  };

  // Handle mouse/touch end
  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;

    const completedElement = { ...currentElement, isComplete: true };
    const newElements = [...elements, completedElement];
    
    setElements(newElements);
    addToHistory(newElements);
    setCurrentElement(null);
    setIsDrawing(false);

    // Notify parent component
    if (onElementAdded) {
      const whiteboardElement: WhiteboardElement = {
        ...completedElement,
        timestamp: new Date(),
        author: 'user'
      };
      onElementAdded(whiteboardElement);
    }
  };

  // Handle text editing
  const handleTextEdit = (elementId: string, newText: string) => {
    const updatedElements = elements.map(el => 
      el.id === elementId 
        ? { ...el, properties: { ...el.properties, text: newText } }
        : el
    );
    setElements(updatedElements);
    addToHistory(updatedElements);

    if (onElementUpdated) {
      const updatedElement = updatedElements.find(el => el.id === elementId);
      if (updatedElement) {
        const whiteboardElement: WhiteboardElement = {
          ...updatedElement,
          timestamp: new Date(),
          author: 'user'
        };
        onElementUpdated(whiteboardElement);
      }
    }
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Clear canvas
  const handleClear = () => {
    setElements([]);
    addToHistory([]);
    if (onStateChanged) {
      onStateChanged({
        id: sessionId,
        sessionId,
        version: 1,
        elements: [],
        canvasState,
        snapshots: [],
        metadata: {
          totalElements: 0,
          lastModifiedBy: 'user',
          collaborationMode: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Save whiteboard state
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const whiteboardState: WhiteboardState = {
        id: sessionId,
        sessionId,
        version: 1,
        elements: elements.map(el => ({
          ...el,
          timestamp: new Date(),
          author: 'user' as const
        })),
        canvasState,
        snapshots: [],
        metadata: {
          totalElements: elements.length,
          lastModifiedBy: 'user',
          collaborationMode: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Here you would typically save to backend
      // await saveWhiteboardState(whiteboardState);
      
      if (onStateChanged) {
        onStateChanged(whiteboardState);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to save whiteboard');
      console.error('Save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add AI-generated element
  const addAIElement = useCallback((aiElement: Omit<WhiteboardElement, 'id' | 'timestamp' | 'author'>) => {
    const newElement: DrawingElement = {
      ...aiElement,
      id: generateElementId(),
      isComplete: true
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);

    if (onElementAdded) {
      const whiteboardElement: WhiteboardElement = {
        ...newElement,
        timestamp: new Date(),
        author: 'ai'
      };
      onElementAdded(whiteboardElement);
    }
  }, [elements, addToHistory, onElementAdded]);

  // Expose addAIElement for external use
  useEffect(() => {
    if (window) {
      (window as any).addAIElement = addAIElement;
    }
  }, [addAIElement]);

  // Render different shape types
  const renderElement = (element: DrawingElement) => {
    const commonProps = {
      key: element.id,
      id: element.id,
      // onClick: () => setSelectedElementId(element.id), // TODO: Implement selection
      stroke: element.properties.stroke,
      fill: element.properties.fill,
      strokeWidth: element.properties.strokeWidth,
      opacity: element.properties.opacity
    };

    switch (element.type) {
      case 'line':
        return (
          <Line
            {...commonProps}
            points={element.points || []}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            x={element.x}
            y={element.y}
            width={element.width || 0}
            height={element.height || 0}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            x={element.x}
            y={element.y}
            radius={(element.width || 0) / 2}
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            x={element.x}
            y={element.y}
            text={element.properties.text || ''}
            fontSize={element.properties.fontSize || 16}
            fontFamily={element.properties.fontFamily || 'Arial'}
            onDblClick={() => {
              const newText = prompt('Edit text:', element.properties.text);
              if (newText !== null) {
                handleTextEdit(element.id, newText);
              }
            }}
          />
        );

      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={element.points || []}
            pointerLength={10}
            pointerWidth={8}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`ai-whiteboard bg-white border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={tool === 'pen' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              disabled={readonly}
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
              disabled={readonly}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              disabled={readonly}
            >
              <CircleIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
              disabled={readonly}
            >
              <Type className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'arrow' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('arrow')}
              disabled={readonly}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              disabled={readonly}
            >
              <Eraser className="w-4 h-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300"
              disabled={readonly}
            />
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
              disabled={readonly}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0 || readonly}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1 || readonly}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={readonly}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isLoading || readonly}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Canvas */}
      <div className="relative overflow-hidden" style={{ width, height }}>
        {/* Grid Background */}
        {canvasState.gridEnabled && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer ref={layerRef}>
            {/* Render existing elements */}
            {elements.map(renderElement)}
            
            {/* Render current drawing element */}
            {currentElement && renderElement(currentElement)}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default AiWhiteboard;
