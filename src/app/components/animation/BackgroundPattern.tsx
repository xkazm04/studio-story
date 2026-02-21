import React, { useEffect, useRef } from 'react';

type Line = {
  thickness: number;
  length: number;
  angle: number;
  top: number;
  left: number;
  speed: number;
  opacity: number;
  color: string;
};

interface BackgroundPatternProps {
  numLines?: number;
  colorScheme?: 'blue' | 'purple' | 'mixed';
}

const BackgroundPattern: React.FC<BackgroundPatternProps> = ({ 
  numLines = 15,
  colorScheme = 'mixed'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Line[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  
  const getRandomColor = () => {
    switch (colorScheme) {
      case 'blue':
        return `rgba(56, 189, 248, ${Math.random() * 0.3 + 0.1})`;
      case 'purple':
        return `rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1})`;
      case 'mixed':
      default:
        return Math.random() > 0.5 
          ? `rgba(56, 189, 248, ${Math.random() * 0.3 + 0.1})` 
          : `rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1})`;
    }
  };

  const initializeLines = () => {
    const lines: Line[] = [];
    
    for (let i = 0; i < numLines; i++) {
      lines.push({
        thickness: Math.random() * 1 + 0.5, // 0.5px to 1.5px
        length: Math.random() * 200 + 100, // 100px to 300px
        angle: Math.random() * 60 - 30, // -30deg to 30deg
        top: Math.random() * 100, // 0% to 100%
        left: Math.random() * 100, // 0% to 100%
        speed: Math.random() * 0.05 + 0.02, // Movement speed
        opacity: Math.random() * 0.5 + 0.2, // Line opacity
        color: getRandomColor(),
      });
    }
    
    linesRef.current = lines;
    return lines;
  };

  const drawLines = () => {
    const container = containerRef.current;
    if (!container) return;
    
    container.innerHTML = '';
    
    linesRef.current.forEach(line => {
      const lineElement = document.createElement('div');
      lineElement.classList.add('diagonal-line');
      
      lineElement.style.height = `${line.thickness}px`;
      lineElement.style.width = `${line.length}px`;
      lineElement.style.transform = `rotate(${line.angle}deg)`;
      lineElement.style.top = `${line.top}%`;
      lineElement.style.left = `${line.left}%`;
      lineElement.style.opacity = `${line.opacity}`;
      lineElement.style.backgroundColor = line.color;
      lineElement.style.position = 'absolute';
      lineElement.style.boxShadow = `0 0 8px ${line.color}`;
      
      container.appendChild(lineElement);
    });
  };

  const animateLines = () => {
    linesRef.current = linesRef.current.map(line => {
      // Move lines slowly across the screen
      line.left += line.speed;
      
      // Reset position when line goes off screen
      if (line.left > 120) {
        line.left = -20;
        line.top = Math.random() * 100;
        line.angle = Math.random() * 60 - 30;
      }
      
      return line;
    });
    
    drawLines();
    animationRef.current = requestAnimationFrame(animateLines);
  };

  useEffect(() => {
    initializeLines();
    drawLines();
    animationRef.current = requestAnimationFrame(animateLines);

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [numLines, colorScheme]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden z-0 opacity-60"
      aria-hidden="true"
    />
  );
};

export default BackgroundPattern;


