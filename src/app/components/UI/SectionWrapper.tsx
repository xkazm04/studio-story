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
    sm: 'p-1.5',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <div className={`relative group bg-slate-850/50 backdrop-blur-sm transition-all duration-300 rounded-lg ${paddingClasses[padding]} ${className}`}>
      <ColoredBorder color={borderColor} />
      {children}
    </div>
  );
}

