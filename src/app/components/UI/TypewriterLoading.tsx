'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterLoadingProps {
  text: string;
  speed?: number;
  className?: string;
}

/**
 * TypewriterLoading Component
 * Displays text with a typewriter effect for loading states
 * Used to create engaging loading experiences during AI operations
 */
export const TypewriterLoading: React.FC<TypewriterLoadingProps> = ({
  text,
  speed = 50,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      // Reset after a delay to loop
      const resetTimeout = setTimeout(() => {
        setDisplayedText('');
        setCurrentIndex(0);
      }, 1500);

      return () => clearTimeout(resetTimeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block ml-0.5"
      >
        |
      </motion.span>
    </span>
  );
};

export default TypewriterLoading;
