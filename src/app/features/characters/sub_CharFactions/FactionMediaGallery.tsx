'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, FileText, Shield, Camera, Trash2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FactionMedia } from '@/app/types/Faction';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import MediaGallery, { MediaItem } from '@/app/components/UI/MediaGallery';

interface FactionMediaGalleryProps {
  media: FactionMedia[];
  factionId: string;
  isLeader: boolean;
  onUploadClick: () => void;
  onDeleteMedia: (mediaId: string) => void;
}

type MediaTypeFilter = 'all' | 'logo' | 'banner' | 'emblem' | 'screenshot' | 'lore';

const MEDIA_TYPE_ICONS = {
  logo: Shield,
  banner: ImageIcon,
  emblem: Shield,
  screenshot: Camera,
  lore: FileText,
};

const MEDIA_TYPE_LABELS = {
  logo: 'Logos',
  banner: 'Banners',
  emblem: 'Emblems',
  screenshot: 'Screenshots',
  lore: 'Lore Documents',
};

const FactionMediaGallery: React.FC<FactionMediaGalleryProps> = ({
  media,
  factionId,
  isLeader,
  onUploadClick,
  onDeleteMedia,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<MediaTypeFilter>('all');

  // Filter media by type
  const filteredMedia = selectedFilter === 'all'
    ? media
    : media.filter(m => m.type === selectedFilter);

  // Get featured media (first logo or banner)
  const featuredMedia = media.find(m => m.type === 'logo') || media.find(m => m.type === 'banner');

  // Count by type
  const mediaTypeCount = media.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDeleteClick = (mediaId: string) => {
    if (confirm('Delete this media? This cannot be undone.')) {
      onDeleteMedia(mediaId);
    }
  };

  // Convert FactionMedia to MediaItem format
  const convertToMediaItems = (factionMedia: FactionMedia[]): MediaItem[] => {
    return factionMedia.map(m => ({
      id: m.id,
      url: m.url,
      type: 'image' as const, // Faction media is primarily images
      alt: m.description || m.type,
      description: m.description,
      metadata: {
        factionId: m.faction_id,
        uploadedAt: m.uploaded_at,
        uploaderId: m.uploader_id,
        mediaType: m.type,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Featured Media Section */}
      {featuredMedia && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
        >
          <ColoredBorder color="purple" />
          <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {featuredMedia.url ? (
                <img
                  src={featuredMedia.url}
                  alt={featuredMedia.description || 'Featured media'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-600 text-6xl font-bold">
                  {featuredMedia.type.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
            {/* Glass-morphism overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Featured {featuredMedia.type}</p>
                  {featuredMedia.description && (
                    <p className="text-gray-300 text-sm">{featuredMedia.description}</p>
                  )}
                </div>
                <div className="text-gray-400 text-xs">
                  {new Date(featuredMedia.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ImageIcon size={18} />
          Media Gallery ({media.length})
        </h3>
        {isLeader && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            data-testid="upload-media-btn"
          >
            <Upload size={16} />
            Upload Media
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={cn('px-4 py-2 rounded-lg transition-all',
            selectedFilter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          )}
          data-testid="filter-all-btn"
        >
          All ({media.length})
        </button>
        {Object.entries(MEDIA_TYPE_LABELS).map(([type, label]) => {
          const count = mediaTypeCount[type] || 0;
          const Icon = MEDIA_TYPE_ICONS[type as keyof typeof MEDIA_TYPE_ICONS];
          return (
            <button
              key={type}
              onClick={() => setSelectedFilter(type as MediaTypeFilter)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                selectedFilter === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
              data-testid={`filter-${type}-btn`}
            >
              <Icon size={14} />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Reusable MediaGallery Component */}
      <MediaGallery
        media={convertToMediaItems(filteredMedia)}
        columns={4}
        spacing={4}
        color="purple"
        pagination={filteredMedia.length > 12}
        itemsPerPage={12}
        emptyMessage={`No ${selectedFilter === 'all' ? '' : selectedFilter} media uploaded yet`}
        renderActions={
          isLeader
            ? (item) => (
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="p-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                  data-testid={`delete-media-${item.id}`}
                >
                  <Trash2 size={14} />
                </button>
              )
            : undefined
        }
      />
    </div>
  );
};

export default FactionMediaGallery;
