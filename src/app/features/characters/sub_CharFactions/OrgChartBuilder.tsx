'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Move,
  User,
  UserPlus,
  UserMinus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  RotateCcw,
  GitBranch,
  Shield,
  Crown,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Search,
  Camera,
  History,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionHierarchy,
  HierarchyNode,
  HierarchyRole,
  HierarchyEngine,
  autoLayoutNodes,
  getCommandChain,
  getDescendants,
  ORGANIZATION_TYPE_CONFIG,
  ROLE_PERMISSION_CONFIG,
  generateNodeId,
} from '@/lib/hierarchy/HierarchyEngine';
import { Character } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

interface OrgChartBuilderProps {
  hierarchy: FactionHierarchy;
  characters: Character[];
  onHierarchyChange: (hierarchy: FactionHierarchy) => void;
  readOnly?: boolean;
}

interface NodeEditorModalProps {
  node: HierarchyNode;
  roles: HierarchyRole[];
  characters: Character[];
  assignedCharacterIds: Set<string>;
  onSave: (node: HierarchyNode) => void;
  onCancel: () => void;
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

// ============================================================================
// Constants
// ============================================================================

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

// ============================================================================
// Sub-components
// ============================================================================

const OrgNode: React.FC<{
  node: HierarchyNode;
  role?: HierarchyRole;
  isSelected: boolean;
  isHighlighted: boolean;
  zoom: number;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVacate: () => void;
  readOnly?: boolean;
}> = ({
  node,
  role,
  isSelected,
  isHighlighted,
  zoom,
  onSelect,
  onDragStart,
  onAddChild,
  onEdit,
  onDelete,
  onVacate,
  readOnly,
}) => {
  const isVacant = node.is_vacant;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'absolute rounded-lg border-2 shadow-lg cursor-pointer transition-all',
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/50'
          : isHighlighted
          ? 'border-purple-500'
          : isVacant
          ? 'border-amber-500/50 border-dashed'
          : 'border-slate-600',
        isVacant ? 'bg-slate-800/80' : 'bg-slate-800'
      )}
      style={{
        left: node.position.x - NODE_WIDTH / 2,
        top: node.position.y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={!readOnly ? onDragStart : undefined}
    >
      {/* Role color bar */}
      {role?.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-md"
          style={{ backgroundColor: role.color }}
        />
      )}

      <div className="p-2 pt-3 h-full flex flex-col">
        {/* Role title */}
        <div className="flex items-center gap-1 mb-1">
          {role?.level === 0 ? (
            <Crown size={12} className="text-amber-400" />
          ) : (
            <Shield size={12} className="text-slate-500" />
          )}
          <span className="text-[10px] font-medium text-slate-400 truncate">
            {role?.title || 'Unknown Role'}
          </span>
        </div>

        {/* Character info */}
        <div className="flex items-center gap-2 flex-1">
          {node.character_avatar ? (
            <img
              src={node.character_avatar}
              alt={node.character_name}
              className="w-10 h-10 rounded-full object-cover border border-slate-600"
            />
          ) : (
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isVacant ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-700'
            )}>
              {isVacant ? (
                <AlertTriangle size={16} className="text-amber-400" />
              ) : (
                <User size={16} className="text-slate-500" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isVacant ? (
              <span className="text-xs text-amber-400 font-medium">VACANT</span>
            ) : (
              <span className="text-sm text-white font-medium truncate block">
                {node.character_name || 'Unassigned'}
              </span>
            )}
          </div>
        </div>

        {/* Actions (show on hover/select) */}
        {!readOnly && isSelected && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              className="p-1 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded"
            >
              <span title="Add subordinate">
                <Plus size={14} />
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded"
            >
              <span title="Edit node">
                <Edit3 size={14} />
              </span>
            </button>
            {!isVacant && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVacate();
                }}
                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded"
              >
                <span title="Vacate position">
                  <UserMinus size={14} />
                </span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
            >
              <span title="Delete node">
                <Trash2 size={14} />
              </span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ConnectionLine: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  isHighlighted: boolean;
}> = ({ from, to, isHighlighted }) => {
  // Calculate control points for curved line
  const midY = (from.y + to.y) / 2;

  const path = `M ${from.x} ${from.y + NODE_HEIGHT / 2}
                C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - NODE_HEIGHT / 2}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={isHighlighted ? '#a855f7' : '#475569'}
      strokeWidth={isHighlighted ? 2 : 1.5}
      strokeDasharray={isHighlighted ? undefined : '4 2'}
      className="transition-all"
    />
  );
};

const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  node,
  roles,
  characters,
  assignedCharacterIds,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<HierarchyNode>({ ...node });
  const [searchQuery, setSearchQuery] = useState('');

  const availableCharacters = useMemo(() => {
    return characters.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isAvailable = !assignedCharacterIds.has(c.id) || c.id === node.character_id;
      return matchesSearch && isAvailable;
    });
  }, [characters, searchQuery, assignedCharacterIds, node.character_id]);

  const handleCharacterSelect = (character: Character | null) => {
    if (character) {
      setFormData({
        ...formData,
        character_id: character.id,
        character_name: character.name,
        character_avatar: character.avatar_url,
        is_vacant: false,
      });
    } else {
      setFormData({
        ...formData,
        character_id: undefined,
        character_name: undefined,
        character_avatar: undefined,
        is_vacant: true,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-cyan-400" size={20} />
            Edit Position
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} (Level {role.level})
                </option>
              ))}
            </select>
          </div>

          {/* Character Assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Assign Character
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {/* Vacant option */}
              <button
                onClick={() => handleCharacterSelect(null)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left',
                  formData.is_vacant
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-amber-400" />
                </div>
                <span className="text-sm text-amber-400">Leave Vacant</span>
                {formData.is_vacant && <Check size={14} className="ml-auto text-cyan-400" />}
              </button>

              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => handleCharacterSelect(character)}
                  className={cn(
                    'w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left',
                    formData.character_id === character.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User size={14} className="text-slate-400" />
                    </div>
                  )}
                  <span className="text-sm text-white">{character.name}</span>
                  {formData.character_id === character.id && (
                    <Check size={14} className="ml-auto text-cyan-400" />
                  )}
                </button>
              ))}

              {availableCharacters.length === 0 && searchQuery && (
                <p className="text-xs text-slate-500 text-center py-2">No characters found</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={() => onSave(formData)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <Check size={16} />
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const OrgChartBuilder: React.FC<OrgChartBuilderProps> = ({
  hierarchy,
  characters,
  onHierarchyChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  });

  // Get assigned character IDs
  const assignedCharacterIds = useMemo(() => {
    return new Set(
      hierarchy.nodes
        .filter((n) => n.character_id)
        .map((n) => n.character_id!)
    );
  }, [hierarchy.nodes]);

  // Create engine instance
  const engine = useMemo(() => new HierarchyEngine({ ...hierarchy }), [hierarchy]);

  // Build connections
  const connections = useMemo(() => {
    const conns: Array<{ from: HierarchyNode; to: HierarchyNode }> = [];
    hierarchy.nodes.forEach((node) => {
      if (node.parent_id) {
        const parent = hierarchy.nodes.find((n) => n.id === node.parent_id);
        if (parent) {
          conns.push({ from: parent, to: node });
        }
      }
    });
    return conns;
  }, [hierarchy.nodes]);

  // Handle node selection and path highlighting
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);

    // Highlight command chain
    const chain = getCommandChain(nodeId, hierarchy.nodes);
    const descendants = getDescendants(nodeId, hierarchy.nodes);
    const pathIds = new Set([...chain.map((n) => n.id), ...descendants.map((n) => n.id)]);
    setHighlightedPath(pathIds);
  }, [hierarchy.nodes]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedPath(new Set());
  }, []);

  // Node operations
  const handleAddNode = useCallback((parentId?: string) => {
    if (hierarchy.roles.length === 0) {
      alert('Please add at least one role first');
      return;
    }

    const parentNode = parentId ? hierarchy.nodes.find((n) => n.id === parentId) : null;
    const parentRole = parentNode
      ? hierarchy.roles.find((r) => r.id === parentNode.role_id)
      : null;

    // Find appropriate role (next level down, or same level)
    let defaultRole = hierarchy.roles[0];
    if (parentRole) {
      const nextLevelRole = hierarchy.roles.find((r) => r.level === parentRole.level + 1);
      if (nextLevelRole) {
        defaultRole = nextLevelRole;
      }
    }

    // Calculate position
    let position = { x: 400, y: 50 };
    if (parentNode) {
      const siblings = hierarchy.nodes.filter((n) => n.parent_id === parentId);
      position = {
        x: parentNode.position.x + (siblings.length - 1) * 100,
        y: parentNode.position.y + 150,
      };
    }

    const newNode: HierarchyNode = {
      id: generateNodeId(),
      role_id: defaultRole.id,
      parent_id: parentId,
      children: [],
      position,
      is_vacant: true,
    };

    // Update parent's children
    const updatedNodes = [...hierarchy.nodes, newNode];
    if (parentId) {
      const parentIndex = updatedNodes.findIndex((n) => n.id === parentId);
      if (parentIndex !== -1) {
        updatedNodes[parentIndex] = {
          ...updatedNodes[parentIndex],
          children: [...updatedNodes[parentIndex].children, newNode.id],
        };
      }
    }

    onHierarchyChange({
      ...hierarchy,
      nodes: updatedNodes,
      root_node_id: hierarchy.root_node_id || newNode.id,
      updated_at: new Date().toISOString(),
    });

    setSelectedNodeId(newNode.id);
    setEditingNode(newNode);
  }, [hierarchy, onHierarchyChange]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = hierarchy.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const descendants = getDescendants(nodeId, hierarchy.nodes);
    const idsToRemove = new Set([nodeId, ...descendants.map((d) => d.id)]);

    let updatedNodes = hierarchy.nodes.filter((n) => !idsToRemove.has(n.id));

    // Remove from parent's children
    if (node.parent_id) {
      const parentIndex = updatedNodes.findIndex((n) => n.id === node.parent_id);
      if (parentIndex !== -1) {
        updatedNodes[parentIndex] = {
          ...updatedNodes[parentIndex],
          children: updatedNodes[parentIndex].children.filter((id) => id !== nodeId),
        };
      }
    }

    onHierarchyChange({
      ...hierarchy,
      nodes: updatedNodes,
      root_node_id: hierarchy.root_node_id === nodeId ? undefined : hierarchy.root_node_id,
      updated_at: new Date().toISOString(),
    });

    setSelectedNodeId(null);
    setHighlightedPath(new Set());
  }, [hierarchy, onHierarchyChange]);

  const handleVacateNode = useCallback((nodeId: string) => {
    const updatedNodes = hierarchy.nodes.map((n) => {
      if (n.id === nodeId) {
        return {
          ...n,
          character_id: undefined,
          character_name: undefined,
          character_avatar: undefined,
          is_vacant: true,
        };
      }
      return n;
    });

    onHierarchyChange({
      ...hierarchy,
      nodes: updatedNodes,
      updated_at: new Date().toISOString(),
    });
  }, [hierarchy, onHierarchyChange]);

  const handleSaveNode = useCallback((updatedNode: HierarchyNode) => {
    const updatedNodes = hierarchy.nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );

    onHierarchyChange({
      ...hierarchy,
      nodes: updatedNodes,
      updated_at: new Date().toISOString(),
    });

    setEditingNode(null);
  }, [hierarchy, onHierarchyChange]);

  // Drag handling for nodes
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (readOnly) return;

    e.stopPropagation();
    const node = hierarchy.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDragState({
      isDragging: true,
      nodeId,
      startPosition: { x: e.clientX, y: e.clientY },
      currentPosition: node.position,
    });
  }, [hierarchy.nodes, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.nodeId) {
      const dx = (e.clientX - dragState.startPosition.x) / zoom;
      const dy = (e.clientY - dragState.startPosition.y) / zoom;

      const newPosition = {
        x: dragState.currentPosition.x + dx,
        y: dragState.currentPosition.y + dy,
      };

      const updatedNodes = hierarchy.nodes.map((n) =>
        n.id === dragState.nodeId ? { ...n, position: newPosition } : n
      );

      onHierarchyChange({
        ...hierarchy,
        nodes: updatedNodes,
      });

      setDragState((prev) => ({
        ...prev,
        startPosition: { x: e.clientX, y: e.clientY },
        currentPosition: newPosition,
      }));
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragState, zoom, hierarchy, onHierarchyChange, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      nodeId: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    });
    setIsPanning(false);
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (hierarchy.nodes.length === 0) return;

    const minX = Math.min(...hierarchy.nodes.map((n) => n.position.x));
    const maxX = Math.max(...hierarchy.nodes.map((n) => n.position.x));
    const minY = Math.min(...hierarchy.nodes.map((n) => n.position.y));
    const maxY = Math.max(...hierarchy.nodes.map((n) => n.position.y));

    const width = maxX - minX + NODE_WIDTH * 2;
    const height = maxY - minY + NODE_HEIGHT * 2;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const newZoom = Math.min(
      containerWidth / width,
      containerHeight / height,
      MAX_ZOOM
    );

    setZoom(Math.max(MIN_ZOOM, newZoom * 0.9));
    setPan({
      x: (containerWidth - width * newZoom) / 2 - minX * newZoom + NODE_WIDTH,
      y: (containerHeight - height * newZoom) / 2 - minY * newZoom + NODE_HEIGHT,
    });
  }, [hierarchy.nodes]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = autoLayoutNodes(hierarchy.nodes);
    onHierarchyChange({
      ...hierarchy,
      nodes: layoutedNodes,
      updated_at: new Date().toISOString(),
    });
  }, [hierarchy, onHierarchyChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId && !readOnly) {
        handleDeleteNode(selectedNodeId);
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setHighlightedPath(new Set());
        setEditingNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, handleDeleteNode, readOnly]);

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <GitBranch size={16} className="text-cyan-400" />
            Organization Chart
          </span>
          <span className="text-xs text-slate-500">
            {hierarchy.nodes.length} positions
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <button
                onClick={() => handleAddNode()}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                <Plus size={12} />
                Add Root
              </button>
              <button
                onClick={handleAutoLayout}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <span title="Auto-layout">
                  <RotateCcw size={14} />
                </span>
              </button>
            </>
          )}

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
            <span title="Fit to screen">
              <Maximize2 size={14} />
            </span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950"
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
        style={{ cursor: isPanning ? 'grabbing' : dragState.isDragging ? 'move' : 'default' }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #334155 1px, transparent 1px),
              linear-gradient(to bottom, #334155 1px, transparent 1px)
            `,
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Transformed content */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connection lines */}
          <svg
            className="absolute"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {connections.map(({ from, to }) => (
              <ConnectionLine
                key={`${from.id}-${to.id}`}
                from={from.position}
                to={to.position}
                isHighlighted={highlightedPath.has(from.id) && highlightedPath.has(to.id)}
              />
            ))}
          </svg>

          {/* Nodes */}
          <AnimatePresence>
            {hierarchy.nodes.map((node) => {
              const role = hierarchy.roles.find((r) => r.id === node.role_id);
              return (
                <OrgNode
                  key={node.id}
                  node={node}
                  role={role}
                  isSelected={selectedNodeId === node.id}
                  isHighlighted={highlightedPath.has(node.id)}
                  zoom={zoom}
                  onSelect={() => handleNodeSelect(node.id)}
                  onDragStart={(e) => handleNodeDragStart(node.id, e)}
                  onAddChild={() => handleAddNode(node.id)}
                  onEdit={() => setEditingNode(node)}
                  onDelete={() => handleDeleteNode(node.id)}
                  onVacate={() => handleVacateNode(node.id)}
                  readOnly={readOnly}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {hierarchy.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-3 text-slate-600" size={48} />
              <p className="text-slate-500 mb-3">No positions in the organization chart</p>
              {!readOnly && hierarchy.roles.length > 0 && (
                <button
                  onClick={() => handleAddNode()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  Add First Position
                </button>
              )}
              {hierarchy.roles.length === 0 && (
                <p className="text-xs text-slate-600 mt-2">
                  Add roles first using the Role Template Library
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected node info */}
      {selectedNodeId && (
        <div className="flex-shrink-0 p-2 border-t border-slate-700 bg-slate-800/50">
          {(() => {
            const node = hierarchy.nodes.find((n) => n.id === selectedNodeId);
            const role = node ? hierarchy.roles.find((r) => r.id === node.role_id) : null;
            if (!node || !role) return null;

            return (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    <strong className="text-white">{role.title}</strong>
                    {node.character_name && (
                      <> - {node.character_name}</>
                    )}
                  </span>
                  {role.permissions.length > 0 && (
                    <div className="flex gap-1">
                      {role.permissions.slice(0, 3).map((perm) => (
                        <span
                          key={perm}
                          className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px]"
                        >
                          {ROLE_PERMISSION_CONFIG[perm].label}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="text-slate-500">+{role.permissions.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-slate-500">
                  Press Delete to remove, Escape to deselect
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Node Editor Modal */}
      <AnimatePresence>
        {editingNode && (
          <NodeEditorModal
            node={editingNode}
            roles={hierarchy.roles}
            characters={characters}
            assignedCharacterIds={assignedCharacterIds}
            onSave={handleSaveNode}
            onCancel={() => setEditingNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrgChartBuilder;
