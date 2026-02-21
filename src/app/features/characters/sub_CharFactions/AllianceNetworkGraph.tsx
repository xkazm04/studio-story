'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  Handshake,
  Swords,
  Shield,
  Crown,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionRelationship,
  FactionPolitics,
  FactionInfluence,
  RelationshipType,
  RELATIONSHIP_TYPE_CONFIG,
  POLITICAL_STANCE_CONFIG,
  calculateTotalPower,
} from '@/lib/politics/PoliticsEngine';
import { Faction } from '@/app/types/Faction';

// ============================================================================
// Types
// ============================================================================

interface AllianceNetworkGraphProps {
  factions: Faction[];
  politics: Map<string, FactionPolitics>;
  relationships: FactionRelationship[];
  influences: Map<string, FactionInfluence>;
  selectedFactionId?: string;
  onFactionSelect?: (factionId: string) => void;
  onRelationshipSelect?: (relationship: FactionRelationship) => void;
}

interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  politics?: FactionPolitics;
  influence?: FactionInfluence;
  power: number;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: FactionRelationship;
  color: string;
  width: number;
  dashed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_NODE_RADIUS = 25;
const MAX_NODE_RADIUS = 50;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

const RELATIONSHIP_FILTERS: { type: RelationshipType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'allied', label: 'Allied' },
  { type: 'friendly', label: 'Friendly' },
  { type: 'neutral', label: 'Neutral' },
  { type: 'tense', label: 'Tense' },
  { type: 'hostile', label: 'Hostile' },
  { type: 'war', label: 'At War' },
];

// ============================================================================
// Sub-components
// ============================================================================

const FactionNode: React.FC<{
  node: NetworkNode;
  isSelected: boolean;
  isHighlighted: boolean;
  showLabels: boolean;
  zoom: number;
  onSelect: () => void;
}> = ({ node, isSelected, isHighlighted, showLabels, zoom, onSelect }) => {
  const politics = node.politics;
  const stanceConfig = politics ? POLITICAL_STANCE_CONFIG[politics.political_stance] : null;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer ring for selection */}
      {(isSelected || isHighlighted) && (
        <circle
          r={node.radius + 5}
          fill="none"
          stroke={isSelected ? '#06b6d4' : '#8b5cf6'}
          strokeWidth={2}
          opacity={0.8}
        />
      )}

      {/* Main circle */}
      <circle
        r={node.radius}
        fill={node.color}
        stroke={stanceConfig?.color || '#475569'}
        strokeWidth={2}
        opacity={isHighlighted || isSelected ? 1 : 0.8}
      />

      {/* Power indicator (inner ring) */}
      <circle
        r={node.radius * 0.7}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />

      {/* Faction initial */}
      <text
        y={4}
        textAnchor="middle"
        fill="white"
        fontSize={node.radius * 0.8}
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        {node.name.charAt(0)}
      </text>

      {/* Label */}
      {showLabels && (
        <text
          y={node.radius + 15}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={12 / zoom}
          style={{ pointerEvents: 'none' }}
        >
          {node.name}
        </text>
      )}

      {/* Power rank badge */}
      {node.influence && node.influence.power_rank <= 3 && (
        <g transform={`translate(${node.radius - 8}, ${-node.radius + 8})`}>
          <circle r={10} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1} />
          <text y={4} textAnchor="middle" fill="#1e293b" fontSize={10} fontWeight="bold">
            {node.influence.power_rank}
          </text>
        </g>
      )}
    </g>
  );
};

const RelationshipEdge: React.FC<{
  edge: NetworkEdge;
  sourceNode: NetworkNode;
  targetNode: NetworkNode;
  isHighlighted: boolean;
  onSelect: () => void;
}> = ({ edge, sourceNode, targetNode, isHighlighted, onSelect }) => {
  // Calculate edge path
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return null;

  // Calculate start and end points (at edge of circles)
  const startX = sourceNode.x + (dx / distance) * sourceNode.radius;
  const startY = sourceNode.y + (dy / distance) * sourceNode.radius;
  const endX = targetNode.x - (dx / distance) * targetNode.radius;
  const endY = targetNode.y - (dy / distance) * targetNode.radius;

  // Calculate midpoint for the relationship indicator
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  return (
    <g onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Edge line */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={edge.color}
        strokeWidth={isHighlighted ? edge.width + 2 : edge.width}
        strokeDasharray={edge.dashed ? '5,5' : undefined}
        opacity={isHighlighted ? 1 : 0.6}
      />

      {/* Relationship value indicator */}
      <circle
        cx={midX}
        cy={midY}
        r={12}
        fill="#1e293b"
        stroke={edge.color}
        strokeWidth={1.5}
      />
      <text
        x={midX}
        y={midY + 4}
        textAnchor="middle"
        fill={edge.color}
        fontSize={10}
        fontWeight="bold"
      >
        {edge.relationship.relationship_value > 0 ? '+' : ''}
        {edge.relationship.relationship_value}
      </text>

      {/* Secret indicator */}
      {!edge.relationship.is_public && (
        <g transform={`translate(${midX + 15}, ${midY - 15})`}>
          <EyeOff size={12} color="#f59e0b" />
        </g>
      )}
    </g>
  );
};

const RelationshipLegend: React.FC<{
  filter: RelationshipType | 'all';
  onFilterChange: (filter: RelationshipType | 'all') => void;
}> = ({ filter, onFilterChange }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700 p-3">
      <p className="text-xs text-slate-400 mb-2">Relationship Types</p>
      <div className="flex flex-wrap gap-1">
        {RELATIONSHIP_FILTERS.map(({ type, label }) => {
          const config = type === 'all' ? null : RELATIONSHIP_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                filter === type
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              )}
            >
              {config && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FactionInfoPanel: React.FC<{
  node: NetworkNode;
  connectedRelationships: FactionRelationship[];
  onClose: () => void;
}> = ({ node, connectedRelationships, onClose }) => {
  const politics = node.politics;
  const stanceConfig = politics ? POLITICAL_STANCE_CONFIG[politics.political_stance] : null;

  const allies = connectedRelationships.filter(r => r.relationship_value >= 50);
  const enemies = connectedRelationships.filter(r => r.relationship_value <= -50);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-72 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl overflow-hidden"
    >
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: node.color }}
          >
            {node.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium text-white">{node.name}</h3>
            {stanceConfig && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${stanceConfig.color}20`, color: stanceConfig.color }}
              >
                {stanceConfig.label}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Power Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 rounded p-2">
            <p className="text-slate-500">Total Power</p>
            <p className="text-white font-bold text-lg">{node.power}</p>
          </div>
          {node.influence && (
            <div className="bg-slate-800/50 rounded p-2">
              <p className="text-slate-500">Power Rank</p>
              <p className="text-amber-400 font-bold text-lg">#{node.influence.power_rank || '—'}</p>
            </div>
          )}
        </div>

        {/* Politics Stats */}
        {politics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Reputation</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                    style={{ width: `${(politics.diplomatic_reputation + 100) / 2}%` }}
                  />
                </div>
                <span className="text-white">{politics.diplomatic_reputation}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Aggression</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${politics.aggression_level}%` }}
                  />
                </div>
                <span className="text-white">{politics.aggression_level}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Trustworthiness</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${politics.trustworthiness}%` }}
                  />
                </div>
                <span className="text-white">{politics.trustworthiness}</span>
              </div>
            </div>
          </div>
        )}

        {/* Allies & Enemies */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 rounded p-2">
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Handshake size={12} />
              Allies ({allies.length})
            </p>
          </div>
          <div className="bg-red-500/10 rounded p-2">
            <p className="text-xs text-red-400 flex items-center gap-1">
              <Swords size={12} />
              Enemies ({enemies.length})
            </p>
          </div>
        </div>

        {/* Active Treaties */}
        {connectedRelationships.some(r => r.treaties.some(t => t.is_active)) && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Active Treaties</p>
            <div className="space-y-1">
              {connectedRelationships.flatMap(r =>
                r.treaties.filter(t => t.is_active).map(t => (
                  <div key={t.id} className="text-xs bg-slate-800/50 rounded px-2 py-1 flex items-center gap-1">
                    <Shield size={10} className="text-cyan-400" />
                    <span className="text-white">{t.name}</span>
                    <span className="text-slate-500 capitalize">({t.type.replace('_', ' ')})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AllianceNetworkGraph: React.FC<AllianceNetworkGraphProps> = ({
  factions,
  politics,
  relationships,
  influences,
  selectedFactionId,
  onFactionSelect,
  onRelationshipSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipType | 'all'>('all');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate max power for scaling
  const maxPower = useMemo(() => {
    let max = 0;
    for (const influence of influences.values()) {
      const power = calculateTotalPower(influence);
      if (power > max) max = power;
    }
    return max || 100;
  }, [influences]);

  // Build nodes with force-directed layout
  const nodes = useMemo((): NetworkNode[] => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const layoutRadius = Math.min(dimensions.width, dimensions.height) * 0.35;

    return factions.map((faction, index) => {
      const factionPolitics = politics.get(faction.id);
      const influence = influences.get(faction.id);
      const power = influence ? calculateTotalPower(influence) : 10;

      // Calculate node radius based on power
      const normalizedPower = power / maxPower;
      const radius = MIN_NODE_RADIUS + normalizedPower * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);

      // Position in a circle
      const angle = (index / factions.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * layoutRadius;
      const y = centerY + Math.sin(angle) * layoutRadius;

      return {
        id: faction.id,
        name: faction.name,
        x,
        y,
        radius,
        color: faction.color || '#6366f1',
        politics: factionPolitics,
        influence,
        power,
      };
    });
  }, [factions, politics, influences, maxPower, dimensions]);

  // Build edges with filtering
  const edges = useMemo((): NetworkEdge[] => {
    return relationships
      .filter(rel => {
        if (relationshipFilter === 'all') return true;
        return rel.relationship_type === relationshipFilter;
      })
      .map(rel => {
        const config = RELATIONSHIP_TYPE_CONFIG[rel.relationship_type];
        const absValue = Math.abs(rel.relationship_value);
        const width = 1 + (absValue / 100) * 3;

        return {
          id: rel.id,
          source: rel.faction_a_id,
          target: rel.faction_b_id,
          relationship: rel,
          color: config.color,
          width,
          dashed: !rel.is_public,
        };
      });
  }, [relationships, relationshipFilter]);

  // Get connected relationships for selected node
  const selectedNodeRelationships = useMemo(() => {
    if (!selectedNode) return [];
    return relationships.filter(
      r => r.faction_a_id === selectedNode || r.faction_b_id === selectedNode
    );
  }, [selectedNode, relationships]);

  // Get highlighted nodes (connected to selected)
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>();
    selectedNodeRelationships.forEach(r => {
      connected.add(r.faction_a_id);
      connected.add(r.faction_b_id);
    });
    return connected;
  }, [selectedNode, selectedNodeRelationships]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
    onFactionSelect?.(nodeId);
  }, [onFactionSelect]);

  // Handle relationship selection
  const handleRelationshipSelect = useCallback((relationship: FactionRelationship) => {
    onRelationshipSelect?.(relationship);
  }, [onRelationshipSelect]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.shiftKey || e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  const handleFitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Calculate global tension for display
  const globalTension = useMemo(() => {
    const warCount = relationships.filter(r => r.relationship_type === 'war').length;
    const hostileCount = relationships.filter(r => r.relationship_type === 'hostile').length;
    return Math.min(100, warCount * 20 + hostileCount * 10);
  }, [relationships]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <Network size={16} className="text-purple-400" />
            Alliance Network
          </span>
          <span className="text-xs text-slate-500">
            {factions.length} factions · {relationships.length} relationships
          </span>

          {/* Global Tension */}
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={globalTension > 50 ? 'text-red-400' : 'text-amber-400'} />
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  globalTension > 70 ? 'bg-red-500' : globalTension > 40 ? 'bg-amber-500' : 'bg-green-500'
                )}
                style={{ width: `${globalTension}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Tension</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showLabels ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            <span title={showLabels ? 'Hide labels' : 'Show labels'}>
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => handleZoom(-0.1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            <span title="Reset view">
              <RotateCcw size={14} />
            </span>
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, #475569 1px, transparent 1px)`,
            backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* SVG Graph */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Edges (drawn first, behind nodes) */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted =
              selectedNode === edge.source ||
              selectedNode === edge.target;

            return (
              <RelationshipEdge
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isHighlighted={isHighlighted}
                onSelect={() => handleRelationshipSelect(edge.relationship)}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <FactionNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isHighlighted={highlightedNodes.has(node.id)}
              showLabels={showLabels}
              zoom={zoom}
              onSelect={() => handleNodeSelect(node.id)}
            />
          ))}
        </svg>

        {/* Legend */}
        <RelationshipLegend
          filter={relationshipFilter}
          onFilterChange={setRelationshipFilter}
        />

        {/* Selected Node Info Panel */}
        <AnimatePresence>
          {selectedNodeData && (
            <FactionInfoPanel
              node={selectedNodeData}
              connectedRelationships={selectedNodeRelationships}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {factions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Network className="mx-auto mb-3 text-slate-600" size={48} />
              <p className="text-slate-500">No factions to display</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllianceNetworkGraph;
