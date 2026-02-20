'use client';

import { ReactNode } from 'react';
import ColoredBorder from './ColoredBorder';

interface SectionWrapperProps {
  children: ReactNode;
  borderColor?: "blue" | "green" | "purple" | "yellow" | "pink" | "orange" | "gray";
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function SectionWrapper({
  children,
  borderColor = "blue",
  className = "",
  padding = 'md',
}: SectionWrapperProps) {
  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`relative group bg-gray-850/50 backdrop-blur-sm transition-all duration-300 rounded-lg ${paddingClasses[padding]} ${className}`}>
      <ColoredBorder color={borderColor} />
      {children}
    </div>
  );
}

