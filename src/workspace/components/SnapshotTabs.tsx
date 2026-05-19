'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, X, Pencil, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function SnapshotTabs() {
  const namedSnapshots = useWorkspaceStore((s) => s.namedSnapshots);
  const activeSnapshotId = useWorkspaceStore((s) => s.activeSnapshotId);
  const panels = useWorkspaceStore((s) => s.panels);
  const saveNamedSnapshot = useWorkspaceStore((s) => s.saveNamedSnapshot);
  const loadNamedSnapshot = useWorkspaceStore((s) => s.loadNamedSnapshot);
  const deleteNamedSnapshot = useWorkspaceStore((s) => s.deleteNamedSnapshot);
  const renameNamedSnapshot = useWorkspaceStore((s) => s.renameNamedSnapshot);

  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when save mode activates
  useEffect(() => {
    if (saving) {
      requestAnimationFrame(() => saveInputRef.current?.focus());
    }
  }, [saving]);

  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => editInputRef.current?.focus());
    }
  }, [editingId]);

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    saveNamedSnapshot(name);
    setSaveName('');
    setSaving(false);
  }, [saveName, saveNamedSnapshot]);

  const handleRename = useCallback(() => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    renameNamedSnapshot(editingId, name);
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameNamedSnapshot]);

  // Listen for Ctrl+Shift+S to trigger save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setSaving(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Nothing to show if no snapshots and no panels to save
  if (namedSnapshots.length === 0 && !saving && panels.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      {/* Snapshot tabs */}
      {namedSnapshots.map((snap) => {
        const isActive = snap.id === activeSnapshotId;
        const isEditing = editingId === snap.id;

        return (
          <div
            key={snap.id}
            className={cn(
              'group flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors shrink-0',
              isActive
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800/50 bg-slate-900/40 text-slate-400 hover:text-slate-300 hover:border-slate-700/60'
            )}
          >
            {isEditing ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                className="flex items-center gap-1"
              >
                <input
                  ref={editInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setEditingId(null); setEditName(''); } }}
                  className="w-20 bg-transparent text-xs text-slate-200 outline-none"
                  maxLength={30}
                />
                <button type="submit" className="text-cyan-400 hover:text-cyan-300">
                  <Check className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => loadNamedSnapshot(snap.id)}
                  className="truncate max-w-[120px]"
                  title={`Load "${snap.name}"`}
                >
                  {snap.name}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingId(snap.id); setEditName(snap.name); }}
                  className="hidden group-hover:block text-slate-500 hover:text-slate-300"
                  title="Rename"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteNamedSnapshot(snap.id)}
                  className="hidden group-hover:block text-slate-500 hover:text-red-400"
                  title="Delete"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Save inline input */}
      {saving ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-slate-900/60 px-2 py-0.5 shrink-0"
        >
          <Save className="h-3 w-3 text-cyan-400" />
          <input
            ref={saveInputRef}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onBlur={() => { if (!saveName.trim()) setSaving(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSaving(false); setSaveName(''); } }}
            placeholder="Snapshot name..."
            className="w-28 bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none"
            maxLength={30}
          />
          <button
            type="submit"
            disabled={!saveName.trim()}
            className="text-xs text-cyan-400 hover:text-cyan-300 disabled:text-slate-600"
          >
            Save
          </button>
        </form>
      ) : (
        panels.length > 0 && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-xs text-slate-500 transition-colors hover:border-slate-800/50 hover:text-slate-400 shrink-0"
            title="Save workspace snapshot (Ctrl+Shift+S)"
          >
            <Save className="h-3 w-3" />
          </button>
        )
      )}
    </div>
  );
}
