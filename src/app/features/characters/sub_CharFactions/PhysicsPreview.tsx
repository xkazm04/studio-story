'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhysicsPreviewProps {
  emblemContent: React.ReactNode;
  isActive: boolean;
  animationMode?: 'spin' | 'bounce' | 'float' | 'wobble';
}

const PhysicsPreview: React.FC<PhysicsPreviewProps> = ({
  emblemContent,
  isActive,
  animationMode = 'spin',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  // Animation variants for different modes
  const getAnimationVariants = () => {
    const baseRotateX = isHovered ? mousePosition.y * 15 : 0;
    const baseRotateY = isHovered ? mousePosition.x * 15 : 0;

    switch (animationMode) {
      case 'spin':
        return {
          animate: {
            rotateY: [0, 360],
            rotateX: baseRotateX,
            scale: isHovered ? 1.1 : 1,
          },
          transition: {
            rotateY: {
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            },
            rotateX: {
              duration: 0.3,
            },
            scale: {
              duration: 0.3,
            },
          },
        };

      case 'bounce':
        return {
          animate: {
            y: [0, -30, 0],
            rotateX: baseRotateX,
            rotateY: baseRotateY,
            scale: isHovered ? 1.1 : 1,
          },
          transition: {
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as any,
            },
            rotateX: {
              duration: 0.3,
            },
            rotateY: {
              duration: 0.3,
            },
            scale: {
              duration: 0.3,
            },
          },
        };

      case 'float':
        return {
          animate: {
            y: [0, -15, 0],
            rotateZ: [-2, 2, -2],
            rotateX: baseRotateX,
            rotateY: baseRotateY,
            scale: isHovered ? 1.1 : 1,
          },
          transition: {
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut" as any,
            },
            rotateZ: {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut" as any,
            },
            rotateX: {
              duration: 0.3,
            },
            rotateY: {
              duration: 0.3,
            },
            scale: {
              duration: 0.3,
            },
          },
        };

      case 'wobble':
        return {
          animate: {
            rotateZ: [-5, 5, -5],
            rotateX: [baseRotateX - 5, baseRotateX + 5, baseRotateX - 5],
            rotateY: baseRotateY,
            scale: isHovered ? 1.1 : 1,
          },
          transition: {
            rotateZ: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" as any,
            },
            rotateX: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as any,
            },
            rotateY: {
              duration: 0.3,
            },
            scale: {
              duration: 0.3,
            },
          },
        };

      default:
        return { animate: {}, transition: {} };
    }
  };

  const { animate, transition } = getAnimationVariants();

  if (!isActive) {
    return <div className="w-full h-full flex items-center justify-center">{emblemContent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="physics-preview-container"
    >
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>

      <motion.div
        className="transform-style-3d"
        animate={animate}
        transition={transition as any}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="relative">
          {emblemContent}

          {/* Animated glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as any,
            }}
            style={{
              background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
            }}
          />
        </div>
      </motion.div>

      {/* Hover hint */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 text-xs text-gray-400 pointer-events-none"
          >
            Hover to interact
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhysicsPreview;
