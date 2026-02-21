'use client';

import React, { useState, useRef, useEffect } from 'react';
import LandingStats from './LandingStats';
import LandingCardHeader from './LandingCardHeader';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { Project } from '@/app/types/Project';

interface LandingCardProps {
  project: Project;
  index: number;
  onUpdate?: () => void;
}

const LandingCard: React.FC<LandingCardProps> = ({ 
  project, 
  index, 
  onUpdate
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { setSelectedProject, setShowLanding } = useProjectStore();

  // Handle right click to show overlay
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowOverlay(true);
  };

  // Handle outside clicks to close overlay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowOverlay(false);
        setIsRenaming(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCardClick = () => {
    if (!showOverlay) {
      setShowLanding(false);
      setSelectedProject(project);
    }
  };

  const getImageForProjectType = (projectType?: string) => {
    switch (projectType) {
      case 'story':
        return "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/b606595e-e5a4-4de8-bc86-5ed28be2ade9/Leonardo_Phoenix_10_A_rough_handsketched_fantasy_illustration_0.jpg";
      case 'edu':
        return 'https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/6303a304-2823-4d4b-b70f-c917f4b9a3ea/segments/3:4:1/Leonardo_Phoenix_10_A_rough_handsketched_fantasy_illustration_0.jpg';
      case 'shorts':
        return 'https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/38bd24f0-9699-4cda-9589-fce139a8cc89/segments/2:4:1/Leonardo_Phoenix_10_A_rough_handsketched_fantasy_illustration_0.jpg';
      default:
        return 'https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/b606595e-e5a4-4de8-bc86-5ed28be2ade9/Leonardo_Phoenix_10_A_rough_handsketched_fantasy_illustration_0.jpg';
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={`bg-white/5 border border-white/10 rounded-xl p-6 h-80 flex flex-col relative overflow-hidden transition cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 hover:bg-white/10 hover:border-white/20 ${
        index === 0 ? 'animate-float' : index === 1 ? 'animate-float-delay-1' : 'animate-float-delay-2'
      }`}
      data-testid={`project-card-${project.id}`}
    >
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url(${getImageForProjectType(project.type)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center relative z-10">
        <h3 className="text-xl font-semibold mb-4 text-center text-white">{project.name}</h3>
      </div>

      <div className="flex justify-between text-sm text-white relative z-10">
        <span>{project.word_count || 0} words</span>
        <span>{new Date(project.updated_at || project.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
      
      <div 
        className={`absolute inset-0 bg-gray-900/95 backdrop-blur-xs z-30 flex flex-col transition-all duration-300 ease-in-out ${
          showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.97), rgba(15, 15, 25, 0.95))',
          boxShadow: 'inset 0 0 30px rgba(59, 130, 246, 0.1)'
        }}
      >
        <div className="p-6 flex flex-col h-full">
          <LandingCardHeader 
            project={project} 
            setShowOverlay={setShowOverlay} 
            isRenaming={isRenaming} 
            setIsRenaming={setIsRenaming} 
            onUpdate={onUpdate || (() => {})} 
          />
          <LandingStats project={project as any} />
        </div>
      </div>
    </div>
  );
};

export default LandingCard;


