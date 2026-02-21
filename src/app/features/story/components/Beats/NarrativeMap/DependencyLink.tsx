'use client';

import { BeatDependency } from '@/app/types/Beat';

interface DependencyLinkProps {
  dependency: BeatDependency;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isHighlighted: boolean;
}

const DependencyLink = ({
  dependency,
  sourceX,
  sourceY,
  targetX,
  targetY,
  isHighlighted,
}: DependencyLinkProps) => {
  // Calculate node center offsets (assuming node width/height of 192px/auto)
  const nodeWidth = 192;
  const nodeHeight = 80;
  const startX = sourceX + nodeWidth / 2;
  const startY = sourceY + nodeHeight / 2;
  const endX = targetX + nodeWidth / 2;
  const endY = targetY + nodeHeight / 2;

  // Calculate control points for curved path
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Create a smooth curve
  const curvature = 0.3;
  const controlX1 = startX + dx * curvature;
  const controlY1 = startY;
  const controlX2 = endX - dx * curvature;
  const controlY2 = endY;

  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

  // Determine line style based on dependency type
  const getLineStyle = () => {
    switch (dependency.dependency_type) {
      case 'sequential':
        return { stroke: '#3b82f6', strokeDasharray: 'none' };
      case 'parallel':
        return { stroke: '#8b5cf6', strokeDasharray: '5,5' };
      case 'causal':
        return { stroke: '#10b981', strokeDasharray: '10,2' };
      default:
        return { stroke: '#6b7280', strokeDasharray: 'none' };
    }
  };

  // Determine line width based on strength
  const getLineWidth = () => {
    switch (dependency.strength) {
      case 'required':
        return 3;
      case 'suggested':
        return 2;
      case 'optional':
        return 1.5;
      default:
        return 2;
    }
  };

  const lineStyle = getLineStyle();
  const lineWidth = getLineWidth();

  // Calculate arrow position
  const arrowSize = 8;
  const angle = Math.atan2(endY - controlY2, endX - controlX2);

  return (
    <g data-testid={`dependency-link-${dependency.id}`}>
      {/* Glow effect when highlighted */}
      {isHighlighted && (
        <path
          d={path}
          fill="none"
          stroke={lineStyle.stroke}
          strokeWidth={lineWidth + 4}
          strokeDasharray={lineStyle.strokeDasharray}
          opacity={0.3}
          filter="blur(4px)"
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={lineStyle.stroke}
        strokeWidth={lineWidth}
        strokeDasharray={lineStyle.strokeDasharray}
        opacity={isHighlighted ? 0.9 : 0.5}
        className="transition-opacity duration-200"
      />

      {/* Arrow head */}
      <g
        transform={`translate(${endX}, ${endY}) rotate(${(angle * 180) / Math.PI})`}
      >
        <polygon
          points={`0,0 -${arrowSize},-${arrowSize / 2} -${arrowSize},${arrowSize / 2}`}
          fill={lineStyle.stroke}
          opacity={isHighlighted ? 0.9 : 0.5}
        />
      </g>

      {/* Dependency type label (shown on hover) */}
      {isHighlighted && (
        <g>
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 - 10}
            fill="white"
            fontSize="11"
            fontWeight="500"
            textAnchor="middle"
            className="pointer-events-none"
          >
            <tspan fill={lineStyle.stroke}>
              {dependency.dependency_type}
            </tspan>
            {' '}
            <tspan fill="#9ca3af" fontSize="10">
              ({dependency.strength})
            </tspan>
          </text>
        </g>
      )}
    </g>
  );
};

export default DependencyLink;
