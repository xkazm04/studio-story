import React from 'react';
import { BookOpen, Heart, Zap, Target, Shield, Brain } from 'lucide-react';

export interface PromptSection {
  id: string;
  title: string;
  description: string;
  icon: React.JSX.Element;
  placeholder: string;
}

export const PROMPT_SECTIONS: PromptSection[] = [
  {
    id: 'background',
    title: 'Background',
    description: 'Character history, origins, and formative experiences',
    icon: <BookOpen size={18} />,
    placeholder: 'Describe your character\'s background and history...',
  },
  {
    id: 'personality',
    title: 'Personality',
    description: 'Core personality traits, behaviors, and mannerisms',
    icon: <Brain size={18} />,
    placeholder: 'Describe your character\'s personality traits...',
  },
  {
    id: 'motivations',
    title: 'Motivations',
    description: 'Goals, desires, and what drives this character',
    icon: <Target size={18} />,
    placeholder: 'What motivates your character? What are their goals?',
  },
  {
    id: 'strengths',
    title: 'Strengths',
    description: 'Abilities, skills, and positive attributes',
    icon: <Shield size={18} />,
    placeholder: 'List your character\'s strengths and abilities...',
  },
  {
    id: 'weaknesses',
    title: 'Weaknesses',
    description: 'Flaws, limitations, and vulnerabilities',
    icon: <Zap size={18} />,
    placeholder: 'What are your character\'s weaknesses or flaws?',
  },
  {
    id: 'relationships',
    title: 'Core Relationships',
    description: 'Important relationships and social connections',
    icon: <Heart size={18} />,
    placeholder: 'Describe key relationships in your character\'s life...',
  },
];

