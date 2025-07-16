import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, Arrow } from 'react-konva';

interface WhiteboardProps {
  width?: number;
  height?: number;
}

interface DrawingElement {
  type: 'line' | 'text' | 'circle' | 'rect' | 'arrow';
  id: string;
  points?: number[];
  x?: number;
  y?: number;
  text?: string;
  radius?: number;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  fontSize?: number;
}

interface DrawingInstruction {
  type?: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color?: string;
}

export interface WhiteboardRef {
  applyDrawingInstructions: (instructions: (DrawingInstruction | string)[]) => void;
  clearBoard: () => void;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({ 
  width = 600, 
  height = 400 
}, ref) => {
  const stageRef = useRef<any>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);

  /**
   * Parse AI-generated drawing instruction strings into structured objects
   */
  const parseDrawingInstruction = (instruction: string): DrawingInstruction | null => {
    if (!instruction || typeof instruction !== 'string') {
      return null;
    }

    const trimmed = instruction.trim();
    
    try {
      // Handle CLEAR_BOARD command
      if (trimmed.toUpperCase().includes('CLEAR_BOARD')) {
        return { type: 'clear_board' };
      }

      // Parse DRAW_TEXT('text', x=100, y=50)
      const textMatch = trimmed.match(/DRAW_TEXT\s*\(\s*['"`]([^'"`]*?)['"`]\s*,\s*x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)\s*\)/i);
      if (textMatch) {
        return {
          type: 'draw_text',
          text: textMatch[1],
          x: parseInt(textMatch[2]),
          y: parseInt(textMatch[3])
        };
      }

      // Parse DRAW_LINE(x1=50, y1=100, x2=200, y2=100)
      const lineMatch = trimmed.match(/DRAW_LINE\s*\(\s*x1\s*=\s*(\d+)\s*,\s*y1\s*=\s*(\d+)\s*,\s*x2\s*=\s*(\d+)\s*,\s*y2\s*=\s*(\d+)\s*\)/i);
      if (lineMatch) {
        return {
          type: 'draw_line',
          x1: parseInt(lineMatch[1]),
          y1: parseInt(lineMatch[2]),
          x2: parseInt(lineMatch[3]),
          y2: parseInt(lineMatch[4])
        };
      }

      // Parse DRAW_ARROW(x1=50, y1=100, x2=200, y2=100)
      const arrowMatch = trimmed.match(/DRAW_ARROW\s*\(\s*x1\s*=\s*(\d+)\s*,\s*y1\s*=\s*(\d+)\s*,\s*x2\s*=\s*(\d+)\s*,\s*y2\s*=\s*(\d+)\s*\)/i);
      if (arrowMatch) {
        return {
          type: 'draw_arrow',
          x1: parseInt(arrowMatch[1]),
          y1: parseInt(arrowMatch[2]),
          x2: parseInt(arrowMatch[3]),
          y2: parseInt(arrowMatch[4])
        };
      }

      // Parse DRAW_CIRCLE(x=150, y=150, radius=50)
      const circleMatch = trimmed.match(/DRAW_CIRCLE\s*\(\s*x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)\s*,\s*radius\s*=\s*(\d+)\s*\)/i);
      if (circleMatch) {
        return {
          type: 'draw_circle',
          x: parseInt(circleMatch[1]),
          y: parseInt(circleMatch[2]),
          radius: parseInt(circleMatch[3])
        };
      }

      // Parse DRAW_RECTANGLE(x=100, y=100, width=200, height=100)
      const rectMatch = trimmed.match(/DRAW_RECTANGLE\s*\(\s*x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)\s*,\s*width\s*=\s*(\d+)\s*,\s*height\s*=\s*(\d+)\s*\)/i);
      if (rectMatch) {
        return {
          type: 'draw_rectangle',
          x: parseInt(rectMatch[1]),
          y: parseInt(rectMatch[2]),
          width: parseInt(rectMatch[3]),
          height: parseInt(rectMatch[4])
        };
      }

      console.warn('Failed to parse drawing instruction:', instruction);
      return null;
    } catch (error) {
      console.error('Error parsing drawing instruction:', instruction, error);
      return null;
    }
  };

  /**
   * Convert parsed instruction to DrawingElement
   */
  const instructionToElement = (instruction: DrawingInstruction, index: number): DrawingElement | null => {
    const elementId = `ai_${Date.now()}_${index}`;
    const defaultColor = '#2563eb';

    switch (instruction.type?.toLowerCase()) {
      case 'clear_board':
        // This will be handled separately
        return null;

      case 'draw_text':
        return {
          type: 'text',
          id: elementId,
          x: instruction.x || 50,
          y: instruction.y || 50,
          text: instruction.text || 'AI Text',
          stroke: instruction.color || defaultColor,
          fontSize: 16
        };

      case 'draw_line':
        return {
          type: 'line',
          id: elementId,
          points: [
            instruction.x1 || 50,
            instruction.y1 || 50,
            instruction.x2 || 150,
            instruction.y2 || 50
          ],
          stroke: instruction.color || defaultColor
        };

      case 'draw_arrow':
        return {
          type: 'arrow',
          id: elementId,
          points: [
            instruction.x1 || 50,
            instruction.y1 || 50,
            instruction.x2 || 150,
            instruction.y2 || 50
          ],
          stroke: instruction.color || defaultColor
        };

      case 'draw_circle':
        return {
          type: 'circle',
          id: elementId,
          x: instruction.x || 100,
          y: instruction.y || 100,
          radius: instruction.radius || 25,
          stroke: instruction.color || defaultColor,
          fill: 'transparent'
        };

      case 'draw_rectangle':
        return {
          type: 'rect',
          id: elementId,
          x: instruction.x || 50,
          y: instruction.y || 50,
          width: instruction.width || 100,
          height: instruction.height || 60,
          stroke: instruction.color || defaultColor,
          fill: 'transparent'
        };

      default:
        console.warn('Unknown instruction type:', instruction.type);
        return {
          type: 'text',
          id: elementId,
          x: 50,
          y: 50,
          text: `Unknown: ${instruction.type}`,
          stroke: '#ef4444',
          fontSize: 14
        };
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    applyDrawingInstructions: (instructions: (DrawingInstruction | string)[]) => {
      // Safety checks
      if (!instructions || !Array.isArray(instructions)) {
        console.warn('Invalid drawing instructions - not an array:', instructions);
        return;
      }
      
      if (instructions.length === 0) {
        console.log('No drawing instructions to apply');
        return;
      }

      console.log('Processing drawing instructions:', instructions);

      // Check for clear board command
      const hasClearCommand = instructions.some(instruction => {
        if (typeof instruction === 'string') {
          return instruction.toUpperCase().includes('CLEAR_BOARD');
        }
        return instruction.type?.toLowerCase() === 'clear_board';
      });

      if (hasClearCommand) {
        setElements([]);
      }
      
      const newElements: DrawingElement[] = [];
      
      instructions.forEach((instruction, index) => {
        let parsedInstruction: DrawingInstruction | null = null;

        // Handle string instructions (from AI)
        if (typeof instruction === 'string') {
          parsedInstruction = parseDrawingInstruction(instruction);
        } else {
          // Handle object instructions (structured format)
          parsedInstruction = instruction;
        }

        if (parsedInstruction && parsedInstruction.type !== 'clear_board') {
          const element = instructionToElement(parsedInstruction, index);
          if (element) {
            newElements.push(element);
          }
        }
      });

      console.log('Generated elements:', newElements);
      
      if (hasClearCommand) {
        setElements(newElements);
      } else {
        setElements(prev => [...prev, ...newElements]);
      }
    },
    
    clearBoard: () => {
      setElements([]);
    }
  }));

  // Demo content that AI would draw
  useEffect(() => {
    // Show demo content only if no elements exist
    const demoElements: DrawingElement[] = [
      {
        type: 'text',
        id: 'welcome',
        x: 50,
        y: 40,
        text: 'AI Virtual Classroom Whiteboard',
        stroke: '#2563eb',
        fontSize: 18
      },
      {
        type: 'text',
        id: 'subtitle',
        x: 50,
        y: 80,
        text: 'Your AI teacher will draw and explain concepts here',
        stroke: '#64748b',
        fontSize: 14
      },
      {
        type: 'line',
        id: 'demo-line',
        points: [50, 120, 200, 120],
        stroke: '#059669'
      },
      {
        type: 'circle',
        id: 'demo-circle',
        x: 300,
        y: 180,
        radius: 30,
        stroke: '#dc2626',
        fill: 'transparent'
      },
      {
        type: 'rect',
        id: 'demo-rect',
        x: 400,
        y: 150,
        width: 80,
        height: 60,
        stroke: '#7c3aed',
        fill: 'transparent'
      },
      {
        type: 'arrow',
        id: 'demo-arrow',
        points: [220, 180, 280, 180],
        stroke: '#ea580c'
      },
      {
        type: 'text',
        id: 'demo-label',
        x: 50,
        y: 250,
        text: 'Try saying: "Explain photosynthesis" or "What is gravity?"',
        stroke: '#059669',
        fontSize: 12
      }
    ];
    
    setElements(demoElements);
  }, []);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setCurrentPath([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentPath(prev => [...prev, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentPath.length > 0) {
      const newElement: DrawingElement = {
        type: 'line',
        id: `line-${Date.now()}`,
        points: currentPath,
        stroke: '#1f2937'
      };
      
      setElements(prev => [...prev, newElement]);
    }
    
    setCurrentPath([]);
  };

  const clearWhiteboard = () => {
    setElements([]);
  };

  const renderElement = (element: DrawingElement) => {
    switch (element.type) {
      case 'line':
        return (
          <Line
            key={element.id}
            points={element.points || []}
            stroke={element.stroke || '#000'}
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'arrow':
        return (
          <Arrow
            key={element.id}
            points={element.points || []}
            stroke={element.stroke || '#000'}
            strokeWidth={2}
            pointerLength={8}
            pointerWidth={8}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'text':
        return (
          <Text
            key={element.id}
            x={element.x || 0}
            y={element.y || 0}
            text={element.text || ''}
            fontSize={element.fontSize || 16}
            fontFamily="Arial"
            fill={element.stroke || '#000'}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            x={element.x || 0}
            y={element.y || 0}
            radius={element.radius || 25}
            stroke={element.stroke || '#000'}
            fill={element.fill || 'transparent'}
            strokeWidth={2}
          />
        );
      case 'rect':
        return (
          <Rect
            key={element.id}
            x={element.x || 0}
            y={element.y || 0}
            width={element.width || 100}
            height={element.height || 50}
            stroke={element.stroke || '#000'}
            fill={element.fill || 'transparent'}
            strokeWidth={2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-inner">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 ml-4">
            AI Teaching Board
          </span>
        </div>
        
        <button
          onClick={clearWhiteboard}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden" style={{ width, height: height - 60 }}>
        <Stage
          width={width}
          height={height - 60}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {/* Render all elements */}
            {elements.map(renderElement)}
            
            {/* Current drawing path */}
            {isDrawing && currentPath.length > 0 && (
              <Line
                points={currentPath}
                stroke="#1f2937"
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </Layer>
        </Stage>
        
        {/* Overlay instructions */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <p className="text-lg font-medium">AI Drawing Engine</p>
              <p className="text-sm">Ready to visualize AI explanations</p>
              <p className="text-xs mt-2 text-gray-300">
                Supports: TEXT • LINES • ARROWS • CIRCLES • RECTANGLES
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';
