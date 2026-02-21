'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, FolderOpen, Trash2, Loader2, Check, X, Clock,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AudioAssetType, TransportState, TimelineClip } from '../../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface SavedSoundscape {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface SaveLoadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: LaneGroup[];
  transport: TransportState;
  onLoad: (groups: LaneGroup[], transport: TransportState) => void;
  projectId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SaveLoadPanel({
  isOpen,
  onClose,
  groups,
  transport,
  onLoad,
  projectId,
}: SaveLoadPanelProps) {
  const [name, setName] = useState('');
  const [savedList, setSavedList] = useState<SavedSoundscape[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch saved soundscapes
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/soundscapes?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setSavedList(data.soundscapes ?? []);
      }
    } catch {
      // Silently fail
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) fetchList();
  }, [isOpen, fetchList]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => window.addEventListener('mousedown', handleClick), 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Upload base64 audio URLs to storage, return groups with HTTP URLs
  const uploadAudioAndSerialize = async (groups: LaneGroup[]): Promise<LaneGroup[]> => {
    const urlMap = new Map<string, string>();

    // Collect unique base64 URLs
    const base64Urls = new Set<string>();
    for (const g of groups) {
      for (const clip of g.clips) {
        if (clip.audioUrl?.startsWith('data:')) {
          base64Urls.add(clip.audioUrl);
        }
      }
    }

    // Upload each
    for (const url of base64Urls) {
      try {
        const filename = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`;
        const res = await fetch('/api/ai/audio/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl: url, filename, projectId }),
        });
        const data = await res.json();
        if (data.success && data.storageUrl) {
          urlMap.set(url, data.storageUrl);
        }
      } catch {
        // Keep original URL if upload fails
      }
    }

    // Replace URLs in cloned groups
    return groups.map((g) => ({
      ...g,
      clips: g.clips.map((c) => ({
        ...c,
        audioUrl: c.audioUrl ? (urlMap.get(c.audioUrl) ?? c.audioUrl) : undefined,
      })),
    }));
  };

  const handleSave = async () => {
    const saveName = name.trim() || `Soundscape ${new Date().toLocaleDateString()}`;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const serializedGroups = await uploadAudioAndSerialize(groups);

      const res = await fetch('/api/soundscapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: saveName,
          timeline_data: serializedGroups,
          transport_data: transport,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setName('');
        fetchList();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/soundscapes/${id}`);
      const data = await res.json();
      if (data.success && data.soundscape) {
        const loaded = data.soundscape;
        onLoad(loaded.timeline_data as LaneGroup[], loaded.transport_data as TransportState);
        onClose();
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/soundscapes/${id}`, { method: 'DELETE' });
      setSavedList((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently fail
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-12 bottom-12 z-40 w-72 bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl shadow-black/40"
    >
      {/* Save Section */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <Save className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-medium text-slate-200">Save Soundscape</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Soundscape name..."
            className="flex-1 px-2 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-200
              placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40"
            onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-3 py-1.5 rounded text-[11px] font-medium transition-all',
              isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : saveStatus === 'saved'
                  ? 'bg-emerald-600/80 text-white'
                  : 'bg-orange-600 text-white hover:bg-orange-500'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3 h-3" />
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* Load Section */}
      <div className="p-2">
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400">Saved ({savedList.length})</span>
        </div>

        {savedList.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-4">No saved soundscapes</div>
        ) : (
          <div className="space-y-0.5 max-h-48 overflow-auto">
            {savedList.map((s) => (
              <div
                key={s.id}
                onClick={() => !isLoading && handleLoad(s.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors',
                  loadingId === s.id ? 'bg-orange-500/10' : 'hover:bg-slate-800/60'
                )}
              >
                {loadingId === s.id ? (
                  <Loader2 className="w-3 h-3 text-orange-400 animate-spin shrink-0" />
                ) : (
                  <FolderOpen className="w-3 h-3 text-slate-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-300 truncate block">{s.name}</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(s.updated_at)}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="p-0.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close */}
      <div className="px-3 py-1.5 border-t border-slate-800/50 flex justify-end">
        <button
          onClick={onClose}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
