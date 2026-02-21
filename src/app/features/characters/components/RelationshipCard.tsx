'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar, Heart, HeartCrack, Minus, Zap } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Character, CharRelationship } from '@/app/types/Character';
import { relationshipApi } from '@/app/api/relationships';

interface RelationshipCardProps {
  relationship: CharRelationship;
  otherCharacter: Character | undefined;
  onDelete: () => void;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  otherCharacter,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this relationship?')) return;

    setIsDeleting(true);
    try {
      await relationshipApi.deleteRelationship(relationship.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRelationshipIcon = (type?: string) => {
    switch (type) {
      case 'positive':
        return <Heart size={16} className="text-green-500" />;
      case 'negative':
        return <HeartCrack size={16} className="text-red-500" />;
      case 'complicated':
        return <Zap size={16} className="text-yellow-500" />;
      default:
        return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getRelationshipColor = (type?: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/5';
      case 'negative':
        return 'border-red-500/30 bg-red-500/5';
      case 'complicated':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-gray-700 bg-gray-800/30';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'relative group p-4 rounded-lg border transition-all',
        getRelationshipColor(relationship.relationship_type),
        isDeleting && 'opacity-50'
      )}
    >
      {/* Character Name with Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getRelationshipIcon(relationship.relationship_type)}
          <h4 className="font-semibold text-white">
            {otherCharacter?.name || 'Unknown Character'}
          </h4>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Event Date */}
      {relationship.event_date && (
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
          <Calendar size={12} />
          {relationship.event_date}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-300">{relationship.description}</p>

      {/* Relationship Type Badge */}
      {relationship.relationship_type && (
        <div className="mt-3">
          <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded capitalize">
            {relationship.relationship_type}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default RelationshipCard;

