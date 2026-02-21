'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import SoundLibrary, { CollapsedLibrary } from './SoundLibrary';
import TrackGenerator from './TrackGenerator';
import TimelineMixer from './TimelineMixer';
import StemSeparator from './StemSeparator';
import AIDirector from './AIDirector';
import BeatComposer from './BeatComposer';
import SaveLoadPanel from './SaveLoadPanel';
import ExportDialog from './ExportDialog';
import { MOCK_AUDIO_ASSETS, MOCK_TIMELINE_CLIPS } from '../../data/mockAudioData';
import { extractWaveformFromUrl } from '../../lib/waveformExtractor';
import type { AudioAsset, AudioAssetType, TransportState, GeneratedAudioResult, TimelineClip, NarrationResult } from '../../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface SoundDesignerTabProps {
  pendingNarration?: NarrationResult | null;
  onNarrationConsumed?: () => void;
}

export default function SoundDesignerTab({
  pendingNarration,
  onNarrationConsumed,
}: SoundDesignerTabProps) {
  const [showStemModal, setShowStemModal] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [showBeatComposer, setShowBeatComposer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<AudioAsset[]>([]);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [projectId] = useState('default');
  const [transport, setTransport] = useState<TransportState>({
    isPlaying: false,
    playheadPos: 0,
    zoom: 1,
    totalDuration: 185,
  });

  // Expose groups for save/load/export
  const [externalGroups, setExternalGroups] = useState<LaneGroup[] | null>(null);
  const audioEngineRef = useRef<import('../../lib/audioEngine').AudioEngine | null>(null);

  const handleGenerated = useCallback(async (result: GeneratedAudioResult) => {
    const id = `gen-${Date.now()}`;

    // Extract real waveform from audio data (falls back to generated curve)
    const waveformData = result.audioUrl
      ? await extractWaveformFromUrl(result.audioUrl)
      : Array.from({ length: 48 }, (_, i) => {
          const t = i / 48;
          return Math.max(0.05, Math.min(1, 0.5 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.4));
        });

    const newAsset: AudioAsset = {
      id,
      name: result.name,
      type: result.type,
      duration: result.duration,
      waveformData,
      audioUrl: result.audioUrl,
    };
    setGeneratedAssets((prev) => [newAsset, ...prev]);
  }, []);

  // Handle pending narration from Voice Studio
  useEffect(() => {
    if (!pendingNarration || !pendingNarration.clips.length) return;

    // Add narration assets to generated assets
    const newAssets = pendingNarration.clips.map((clip) => clip.asset);
    setGeneratedAssets((prev) => [...newAssets, ...prev]);

    // Signal TimelineMixer to add narration clips (via externalGroups or direct mutation)
    // We'll pass narration clips as initial data that TimelineMixer can ingest
    setExternalGroups((prevGroups) => {
      // Build voice lane clips from narration
      const narrationClips: TimelineClip[] = pendingNarration.clips.map((clip) => ({
        id: `tc-narr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        assetId: clip.asset.id,
        lane: 'voice' as AudioAssetType,
        startTime: clip.startTime,
        duration: clip.asset.duration,
        name: clip.asset.name,
        audioUrl: clip.asset.audioUrl,
        waveformData: clip.asset.waveformData,
      }));

      const baseGroups: LaneGroup[] = prevGroups ?? (['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[]).map((type) => ({
        type,
        collapsed: false,
        muted: false,
        clips: MOCK_TIMELINE_CLIPS.filter((c) => c.lane === type),
      }));

      // Add narration clips to voice lane
      return baseGroups.map((g) =>
        g.type === 'voice'
          ? { ...g, clips: [...g.clips, ...narrationClips] }
          : g
      );
    });

    // Extend duration if needed
    const narrationEnd = Math.max(...pendingNarration.clips.map((c) => c.startTime + c.asset.duration));
    if (narrationEnd > transport.totalDuration) {
      setTransport((prev) => ({ ...prev, totalDuration: Math.ceil(narrationEnd / 10) * 10 + 10 }));
    }

    onNarrationConsumed?.();
  }, [pendingNarration, onNarrationConsumed, transport.totalDuration]);

  // Handle load from SaveLoadPanel
  const handleLoad = useCallback((groups: LaneGroup[], loadedTransport: TransportState) => {
    setExternalGroups(groups);
    setTransport(loadedTransport);
  }, []);

  // Build asset map for audio engine lookup
  const assetMap = new Map<string, AudioAsset>();
  for (const a of MOCK_AUDIO_ASSETS) assetMap.set(a.id, a);
  for (const a of generatedAssets) assetMap.set(a.id, a);

  const totalAssetCount = MOCK_AUDIO_ASSETS.length + generatedAssets.length;

  // Current groups for save/export (either from TimelineMixer or loaded state)
  const currentGroups: LaneGroup[] = externalGroups ?? (['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[]).map((type) => ({
    type,
    collapsed: false,
    muted: false,
    clips: MOCK_TIMELINE_CLIPS.filter((c) => c.lane === type),
  }));

  return (
    <div className="h-full flex flex-col relative">
      {/* Toolbar — spans full width */}
      <TrackGenerator
        onOpenStems={() => setShowStemModal(true)}
        onToggleAI={() => setShowAIDropdown(!showAIDropdown)}
        showAIDropdown={showAIDropdown}
        onGenerated={handleGenerated}
        onToggleBeats={() => { setShowBeatComposer(!showBeatComposer); setShowAIDropdown(false); }}
        showBeatComposer={showBeatComposer}
      />

      {/* AI Director Dropdown */}
      {showAIDropdown && (
        <div className="absolute top-12 right-3 z-30">
          <AIDirector
            onClose={() => setShowAIDropdown(false)}
            onGenerated={handleGenerated}
          />
        </div>
      )}

      {/* Beat Composer Panel */}
      {showBeatComposer && (
        <BeatComposer
          onClose={() => setShowBeatComposer(false)}
          onGenerated={handleGenerated}
        />
      )}

      {/* Main: sidebar + timeline */}
      <div className="flex-1 flex min-h-0">
        {/* Library Sidebar — collapsible */}
        <div
          className={`shrink-0 border-r border-slate-700/40 transition-all duration-200 ${
            sidebarCollapsed ? 'w-10' : 'w-56'
          }`}
        >
          {sidebarCollapsed ? (
            <CollapsedLibrary
              onExpand={() => setSidebarCollapsed(false)}
              assetCount={totalAssetCount}
            />
          ) : (
            <SoundLibrary
              onCollapse={() => setSidebarCollapsed(true)}
              extraAssets={generatedAssets}
            />
          )}
        </div>

        {/* Timeline — hero component */}
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

      {/* Stem Separator Modal */}
      {showStemModal && (
        <StemSeparator onClose={() => setShowStemModal(false)} />
      )}

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
