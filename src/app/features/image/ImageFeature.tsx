'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Pencil, Image as ImageIcon } from 'lucide-react';
import ImageGenerator from './generator/ImageGenerator';
import ImageEditor from './editor/ImageEditor';
import SketchToImage from './sub_Sketch/SketchToImage';
import { Tabs, type TabItem } from '@/app/components/UI';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import InlineTerminal from '@/cli/InlineTerminal';
import { useProjectStore } from '@/app/store/slices/projectSlice';

type TabType = 'generator' | 'sketch' | 'editor';

const tabItems: TabItem[] = [
  { value: 'generator', label: 'Generator', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'sketch', label: 'Sketch', icon: <Pencil className="w-4 h-4" /> },
  { value: 'editor', label: 'Editor', icon: <ImageIcon className="w-4 h-4" /> },
];

const ImageFeature: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generator');
  const { selectedProject } = useProjectStore();

  // CLI integration for image prompt skills
  const cli = useCLIFeature({
    featureId: 'image',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['image-prompt-compose', 'image-prompt-enhance', 'image-prompt-variations', 'cover-prompt', 'avatar-prompt'],
  });

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Tab Navigation */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-900/70 bg-slate-950/95">
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabType)}
          variant="pills"
          data-testid="image-tabs"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            <div className="flex-1 overflow-hidden">
              {activeTab === 'generator' && <ImageGenerator />}
              {activeTab === 'sketch' && <SketchToImage />}
              {activeTab === 'editor' && <ImageEditor />}
            </div>

            {/* CLI Terminal — collapsible below content */}
            {activeTab === 'generator' && (
              <InlineTerminal
                {...cli.terminalProps}
                height={160}
                collapsible
                outputFormat="text"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageFeature;
