'use client';

import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import { RelationshipEdgeData, RelationshipType } from '../types';

// ---------------------------------------------------------------------------
// Sentiment color mapping (CONTEXT.md decisions)
// ---------------------------------------------------------------------------

function getEdgeSentiment(type: RelationshipType): string {
  switch (type) {
    case RelationshipType.ALLY:
    case RelationshipType.FRIEND:
    case RelationshipType.FAMILY:
    case RelationshipType.ROMANTIC:
    case RelationshipType.MENTOR:
      return '#10b981'; // green — positive
    case RelationshipType.ENEMY:
    case RelationshipType.RIVAL:
      return '#ef4444'; // red — negative
    case RelationshipType.NEUTRAL:
    case RelationshipType.UNKNOWN:
    case RelationshipType.BUSINESS:
    default:
      return '#6b7280'; // gray — neutral
  }
}

// ---------------------------------------------------------------------------
// Line style mapping (CONTEXT.md decisions)
// ---------------------------------------------------------------------------

function getEdgeStyle(type: RelationshipType): string {
  switch (type) {
    case RelationshipType.ALLY:
    case RelationshipType.FRIEND:
    case RelationshipType.FAMILY:
    case RelationshipType.MENTOR:
      return 'none'; // solid
    case RelationshipType.RIVAL:
    case RelationshipType.ENEMY:
      return '8 4'; // dashed
    case RelationshipType.ROMANTIC:
    case RelationshipType.NEUTRAL:
    case RelationshipType.UNKNOWN:
    case RelationshipType.BUSINESS:
    default:
      return '2 4'; // dotted
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeData>) => {
  const [hovered, setHovered] = useState(false);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relType = data?.relationshipType ?? RelationshipType.UNKNOWN;
  const color = getEdgeSentiment(relType);
  const dashArray = getEdgeStyle(relType);
  const strokeWidth = selected || hovered ? 3 : 2;

  return (
    <>
      {/* Invisible wider path for easier hover targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray: dashArray,
          opacity: 1,
          transition: 'stroke-width 0.2s ease, filter 0.2s ease',
          filter:
            selected || hovered
              ? `drop-shadow(0 0 6px ${color})`
              : 'none',
        }}
      />
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;
