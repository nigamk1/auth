import React, { useEffect, useRef } from 'react';

interface MathFormulaProps {
  latex: string;
  inline?: boolean;
  className?: string;
  fontSize?: number;
  color?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  latex,
  inline = false,
  className = '',
  fontSize = 16,
  color = '#000000'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Try to use KaTeX if available, fallback to MathJax
    const renderMath = async () => {
      try {
        // Try KaTeX first (faster)
        if (window.katex) {
          window.katex.render(latex, containerRef.current!, {
            displayMode: !inline,
            throwOnError: false,
            fontSize: `${fontSize}px`,
            color: color
          });
          return;
        }

        // Fallback to MathJax
        if (window.MathJax) {
          const element = containerRef.current!;
          element.innerHTML = inline ? `\\(${latex}\\)` : `\\[${latex}\\]`;
          element.style.fontSize = `${fontSize}px`;
          element.style.color = color;
          
          if (window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise([element]);
          } else if (window.MathJax.Hub) {
            window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, element]);
          }
          return;
        }

        // No math renderer available, show LaTeX source
        if (containerRef.current) {
          containerRef.current.innerHTML = `<code>${latex}</code>`;
          containerRef.current.style.fontSize = `${fontSize}px`;
          containerRef.current.style.color = color;
          containerRef.current.style.fontFamily = 'monospace';
          containerRef.current.style.background = '#f5f5f5';
          containerRef.current.style.padding = '2px 4px';
          containerRef.current.style.borderRadius = '3px';
        }
      } catch (error) {
        console.warn('Math rendering failed:', error);
        // Fallback to showing LaTeX source
        if (containerRef.current) {
          containerRef.current.innerHTML = `<code>${latex}</code>`;
        }
      }
    };

    renderMath();
  }, [latex, inline, fontSize, color]);

  return (
    <div
      ref={containerRef}
      className={`math-formula ${inline ? 'inline' : 'block'} ${className}`}
      style={{
        display: inline ? 'inline' : 'block',
        fontSize: `${fontSize}px`,
        color: color
      }}
    />
  );
};

// Hook for loading math libraries
export const useMathLibrary = () => {
  useEffect(() => {
    // Load KaTeX if not already loaded
    if (!window.katex && !document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Load MathJax as fallback if not already loaded
    if (!window.MathJax && !document.querySelector('script[src*="mathjax"]')) {
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
          ignoreHtmlClass: 'math-ignore'
        },
        startup: {
          defaultReady: () => {
            if (window.MathJax?.startup?.defaultReady) {
              window.MathJax.startup.defaultReady();
            }
          }
        }
      };

      const script = document.createElement('script');
      script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6';
      document.head.appendChild(script);

      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script2.async = true;
      document.head.appendChild(script2);
    }
  }, []);
};

// Extended global window interface
declare global {
  interface Window {
    katex?: {
      render: (tex: string, element: HTMLElement, options?: any) => void;
    };
    MathJax?: {
      typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
      Hub?: {
        Queue: (commands: any[]) => void;
      };
      startup?: {
        defaultReady: () => void;
      };
      tex?: any;
      options?: any;
    };
  }
}

export default MathFormula;
