'use client';

import { useState, useCallback, useRef } from 'react';
import { Save, Download, Layers } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import SoundLibrary, { CollapsedLibrary } from '../sound-designer/SoundLibrary';
import TimelineMixer from '../sound-designer/TimelineMixer';
import SaveLoadPanel from '../sound-designer/SaveLoadPanel';
import ExportDialog from '../sound-designer/ExportDialog';
import type { AudioAsset, AudioAssetType, TransportState, TimelineClip } from '../../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface MixerTabProps {
  extraAssets: AudioAsset[];
}

export default function MixerTab({ extraAssets }: MixerTabProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [projectId] = useState('default');
  const [transport, setTransport] = useState<TransportState>({
    isPlaying: false,
    playheadPos: 0,
    zoom: 1,
    totalDuration: 185,
  });

  const [externalGroups, setExternalGroups] = useState<LaneGroup[] | null>(null);
  const audioEngineRef = useRef<import('../../lib/audioEngine').AudioEngine | null>(null);

  const handleLoad = useCallback((groups: LaneGroup[], loadedTransport: TransportState) => {
    setExternalGroups(groups);
    setTransport(loadedTransport);
  }, []);

  // Build asset map for audio engine lookup (only generated assets — no mock data)
  const assetMap = new Map<string, AudioAsset>();
  for (const a of extraAssets) assetMap.set(a.id, a);

  const totalAssetCount = extraAssets.length;

  const currentGroups: LaneGroup[] = externalGroups ?? (['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[]).map((type) => ({
    type,
    collapsed: false,
    muted: false,
    clips: [],
  }));

  return (
    <div className="h-full flex flex-col relative">
      {/* Toolbar */}
      <div
        className="shrink-0 flex items-center gap-3 h-10 px-4 border-b border-orange-500/10"
        style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg border border-orange-500/25"
            style={{ background: 'rgba(249, 115, 22, 0.08)', boxShadow: '0 0 12px rgba(249, 115, 22, 0.1)' }}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">Mixer</span>
        </div>

        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={() => setShowSavePanel(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all"
          title="Save Project"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        {/* Export */}
        <button
          onClick={() => setShowExportDialog(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all"
          title="Export Audio"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main: sidebar + timeline */}
      <div className="flex-1 flex min-h-0">
        {/* Library Sidebar */}
        <div
          className={cn(
            'shrink-0 border-r border-slate-800/50 transition-all duration-300',
            sidebarCollapsed ? 'w-10' : 'w-56'
          )}
        >
          {sidebarCollapsed ? (
            <CollapsedLibrary
              onExpand={() => setSidebarCollapsed(false)}
              assetCount={totalAssetCount}
            />
          ) : (
            <SoundLibrary
              onCollapse={() => setSidebarCollapsed(true)}
              extraAssets={extraAssets}
            />
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 min-w-0">
          <TimelineMixer
            transport={transport}
            onTransportChange={setTransport}
            assetMap={assetMap}
            onSave={() => setShowSavePanel(true)}
            onExport={() => setShowExportDialog(true)}
          />
        </div>
      </div>

      {/* Save/Load Panel */}
      <SaveLoadPanel
        isOpen={showSavePanel}
        onClose={() => setShowSavePanel(false)}
        groups={currentGroups}
        transport={transport}
        onLoad={handleLoad}
        projectId={projectId}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        groups={currentGroups}
        totalDuration={transport.totalDuration}
        audioEngine={audioEngineRef.current}
      />
    </div>
  );
}
