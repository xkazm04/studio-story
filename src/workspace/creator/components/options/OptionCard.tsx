'use client';

import React from 'react';
import { FacetOptionCard } from '@/lib/faceted-spec';
import { CreatorIcon } from '../../icons';
import type { CategoryOption } from '../../types';

interface OptionCardProps {
  option: CategoryOption;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Character-specific OptionCard — thin wrapper around FacetOptionCard
 * that plugs in the CreatorIcon renderer for SVG previews.
 */
export function OptionCard({ option, isSelected, onSelect }: OptionCardProps) {
  return (
    <FacetOptionCard
      option={option}
      isSelected={isSelected}
      onSelect={onSelect}
      renderIcon={(preview, size) => <CreatorIcon name={preview} size={size} />}
    />
  );
}
