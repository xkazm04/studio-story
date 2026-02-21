'use client';

import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow
} from 'reactflow';
import { Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { RelationshipEdgeData, RelationshipType, RelationshipTypeConfig } from '../types';

const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}: EdgeProps<RelationshipEdgeData>) => {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(data?.relationshipType || RelationshipType.ALLY);
  const [showParticles, setShowParticles] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationshipConfig = RelationshipTypeConfig[data?.relationshipType || RelationshipType.ALLY];
  const edgeColor = relationshipConfig.color;

  const handleDelete = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const handleSave = () => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              relationshipType: selectedType
            }
          };
        }
        return edge;
      })
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedType(data?.relationshipType || RelationshipType.ALLY);
    setIsEditing(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          opacity: showParticles ? 0.8 : 1,
          transition: 'all 0.3s ease',
          filter: selected ? `drop-shadow(0 0 8px ${edgeColor})` : 'none'
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="relative"
          onMouseEnter={() => setShowParticles(true)}
          onMouseLeave={() => setShowParticles(false)}
        >
          {!isEditing ? (
            // Display Mode
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300',
                selected
                  ? 'scale-110 shadow-2xl'
                  : 'hover:scale-105'
              )}
              style={{
                backgroundColor: `${edgeColor}30`,
                borderColor: edgeColor,
              }}
            >
              <span
                className="text-xs font-semibold text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {relationshipConfig.label}
              </span>

              {/* Action Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                  title="Edit relationship"
                >
                  <Edit2 className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                  title="Delete relationship"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div
              className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-md border border-white/30 shadow-2xl bg-gray-900/80"
            >
              <div className="text-xs font-semibold text-white mb-1">
                Change Relationship Type:
              </div>
              <div className="grid grid-cols-2 gap-1 max-w-xs">
                {Object.entries(RelationshipTypeConfig).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type as RelationshipType)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      selectedType === type
                        ? 'ring-2 ring-white shadow-lg scale-105'
                        : 'hover:scale-102'
                    )}
                    style={{
                      backgroundColor: `${config.color}50`,
                      borderColor: config.color,
                      color: 'white'
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Particle Effects */}
          {showParticles && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full animate-ping"
                  style={{
                    backgroundColor: edgeColor,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;
