'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { EmblemStyle } from './emblemConfig';
import EmblemSVG from './EmblemSVG';

interface EmblemSVGPreviewProps {
  selectedStyle: EmblemStyle;
  customImage: string | null;
  primaryColor: string;
  factionName: string;
}

/**
 * Renders the emblem content (SVG or custom image) wrapped in a motion container
 * with spring-based enter/exit animations keyed by selectedStyle.
 */
const EmblemSVGPreview: React.FC<EmblemSVGPreviewProps> = ({
  selectedStyle,
  customImage,
  primaryColor,
  factionName,
}) => {
  const initial = factionName.charAt(0).toUpperCase() || 'F';

  return (
    <motion.div
      key={selectedStyle}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative w-48 h-48 mx-auto"
    >
      <EmblemSVG
        style={selectedStyle}
        initial={initial}
        primaryColor={primaryColor}
        customImage={customImage}
      />
    </motion.div>
  );
};

export default EmblemSVGPreview;
