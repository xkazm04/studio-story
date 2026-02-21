'use client';

import { useRef, useEffect, useState } from 'react';
import { BeatTableItem } from '../BeatsOverview';
import { BeatDependency } from '@/app/types/Beat';
import { CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface BeatNodeProps {
  beat: BeatTableItem;
  x: number;
  y: number;
  isSelected: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (beatId: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onClick: () => void;
  dependencies: BeatDependency[];
  zoom: number;
}

const BeatNode = ({
  beat,
  x,
  y,
  isSelected,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  dependencies,
  zoom,
}: BeatNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localPosition, setLocalPosition] = useState({ x, y });

  useEffect(() => {
    setLocalPosition({ x, y });
  }, [x, y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    e.stopPropagation();
    onDragStart();

    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      });
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!nodeRef.current?.parentElement) return;

      const parentRect = nodeRef.current.parentElement.getBoundingClientRect();
      const newX = (moveEvent.clientX - parentRect.left) / zoom - dragOffset.x;
      const newY = (moveEvent.clientY - parentRect.top) / zoom - dragOffset.y;

      setLocalPosition({ x: newX, y: newY });
      onDrag(beat.id, newX, newY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onClick();
    }
  };

  const nodeColor = beat.completed
    ? 'from-green-500/20 to-emerald-500/10 border-green-500/50'
    : 'from-blue-500/20 to-purple-500/10 border-blue-500/50';

  const selectedStyle = isSelected
    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-950'
    : '';

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        left: `${localPosition.x}px`,
        top: `${localPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`group ${selectedStyle}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-testid={`beat-node-${beat.id}`}
    >
      <div
        className={`
          relative w-48 p-4 rounded-lg border-2
          bg-gradient-to-br ${nodeColor}
          backdrop-blur-sm transition-all duration-200
          hover:shadow-lg hover:shadow-blue-500/20
          ${isDragging ? 'shadow-2xl scale-105' : ''}
        `}
      >
        {/* Drag Handle */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>

        {/* Beat Number Badge */}
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
          {(beat.order || 0) + 1}
        </div>

        {/* Completion Badge */}
        <div className="absolute -top-3 -right-3">
          {beat.completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          ) : (
            <Circle className="h-6 w-6 text-gray-600" />
          )}
        </div>

        {/* Beat Type Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`
              text-[10px] px-2 py-0.5 rounded-full font-medium
              ${
                beat.type === 'story'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }
            `}
          >
            {beat.type}
          </span>
        </div>

        {/* Beat Content */}
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-100 truncate" title={beat.name}>
            {beat.name}
          </h3>
          {beat.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2" title={beat.description}>
              {beat.description}
            </p>
          )}
        </div>

        {/* Dependency Count */}
        {dependencies.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400/50" />
              {dependencies.length} connection{dependencies.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Duration Indicator */}
        {beat.estimated_duration && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 whitespace-nowrap">
              ~{beat.estimated_duration} min
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BeatNode;
