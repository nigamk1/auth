import React, { useRef } from 'react';
import { Whiteboard } from './Whiteboard';
import type { WhiteboardRef } from './Whiteboard';

export const WhiteboardTest: React.FC = () => {
  const whiteboardRef = useRef<WhiteboardRef>(null);

  const testBasicShapes = () => {
    const instructions = [
      "CLEAR_BOARD()",
      "DRAW_TEXT('Basic Shapes Demo', x=50, y=30)",
      "DRAW_RECTANGLE(x=50, y=60, width=120, height=80)",
      "DRAW_CIRCLE(x=250, y=100, radius=40)",
      "DRAW_LINE(x1=50, y1=180, x2=170, y2=180)",
      "DRAW_ARROW(x1=200, y1=180, x2=350, y2=180)",
      "DRAW_TEXT('Rectangle', x=60, y=175)",
      "DRAW_TEXT('Circle', x=230, y=175)",
      "DRAW_TEXT('Line', x=100, y=200)",
      "DRAW_TEXT('Arrow', x=250, y=200)"
    ];
    
    if (whiteboardRef.current) {
      whiteboardRef.current.applyDrawingInstructions(instructions);
    }
  };

  const testPhysicsDemo = () => {
    const instructions = [
      "CLEAR_BOARD()",
      "DRAW_TEXT('Newton\\'s Second Law: F = ma', x=50, y=30)",
      "DRAW_RECTANGLE(x=150, y=80, width=80, height=60)",
      "DRAW_TEXT('Object', x=170, y=105)",
      "DRAW_TEXT('m = 5kg', x=165, y=125)",
      "DRAW_ARROW(x1=100, y1=110, x2=150, y2=110)",
      "DRAW_TEXT('F₁ = 20N', x=60, y=95)",
      "DRAW_ARROW(x1=230, y1=110, x2=280, y2=110)",
      "DRAW_TEXT('F₂ = 15N', x=285, y=95)",
      "DRAW_TEXT('Net Force = 5N →', x=50, y=180)",
      "DRAW_TEXT('Acceleration = 1 m/s² →', x=50, y=200)"
    ];
    
    if (whiteboardRef.current) {
      whiteboardRef.current.applyDrawingInstructions(instructions);
    }
  };

  const testMathDemo = () => {
    const instructions = [
      "CLEAR_BOARD()",
      "DRAW_TEXT('Pythagorean Theorem', x=50, y=30)",
      "DRAW_TEXT('a² + b² = c²', x=50, y=60)",
      "DRAW_LINE(x1=150, y1=200, x2=250, y2=200)",
      "DRAW_LINE(x1=150, y1=200, x2=150, y2=120)",
      "DRAW_LINE(x1=150, y1=120, x2=250, y2=200)",
      "DRAW_TEXT('a = 3', x=120, y=160)",
      "DRAW_TEXT('b = 4', x=190, y=220)",
      "DRAW_TEXT('c = 5', x=190, y=150)",
      "DRAW_CIRCLE(x=150, y=200, radius=3)",
      "DRAW_CIRCLE(x=250, y=200, radius=3)",
      "DRAW_CIRCLE(x=150, y=120, radius=3)"
    ];
    
    if (whiteboardRef.current) {
      whiteboardRef.current.applyDrawingInstructions(instructions);
    }
  };

  const clearBoard = () => {
    if (whiteboardRef.current) {
      whiteboardRef.current.clearBoard();
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Whiteboard Drawing Engine Test
        </h1>
        
        {/* Test Controls */}
        <div className="mb-6 space-x-4">
          <button
            onClick={testBasicShapes}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Basic Shapes
          </button>
          <button
            onClick={testPhysicsDemo}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Physics Demo
          </button>
          <button
            onClick={testMathDemo}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Math Demo
          </button>
          <button
            onClick={clearBoard}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Board
          </button>
        </div>

        {/* Whiteboard */}
        <div className="bg-white rounded-lg shadow-lg">
          <Whiteboard 
            ref={whiteboardRef}
            width={800}
            height={500}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Basic Shapes:</strong> Tests all drawing primitives (text, rectangle, circle, line, arrow)</li>
            <li><strong>Physics Demo:</strong> Newton's Second Law with force diagram</li>
            <li><strong>Math Demo:</strong> Pythagorean theorem with right triangle</li>
            <li><strong>Clear Board:</strong> Removes all elements from the whiteboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
