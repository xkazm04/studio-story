/**
 * useCommands Hook
 * Registers default commands with the command palette
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { useCommandPalette } from './CommandPaletteContext';
import { Command } from './types';

export function useCommands() {
  const { registerCommand, unregisterCommand } = useCommandPalette();

  const {
    scenes,
    currentSceneId,
    setCurrentSceneId,
    addScene,
    deleteScene,
    firstSceneId,
    projectId,
  } = useSceneEditor();

  // Scene commands
  useEffect(() => {
    const commands: Command[] = [
      {
        id: 'scene:new',
        label: 'New Scene',
        description: 'Create a new scene',
        icon: '➕',
        shortcut: 'Ctrl+N',
        category: 'scene',
        keywords: ['create', 'add', 'new'],
        action: () => {
          if (!projectId) return;
          addScene({
            id: crypto.randomUUID(),
            name: 'New Scene',
            project_id: projectId,
            act_id: '',
            order: scenes.length,
          });
        },
      },
      {
        id: 'scene:delete',
        label: 'Delete Current Scene',
        description: 'Delete the currently selected scene',
        icon: '🗑️',
        shortcut: 'Ctrl+Backspace',
        category: 'scene',
        keywords: ['remove', 'delete'],
        disabled: !currentSceneId || currentSceneId === firstSceneId,
        action: () => {
          if (currentSceneId && currentSceneId !== firstSceneId) {
            deleteScene(currentSceneId);
          }
        },
      },
      {
        id: 'scene:goto-first',
        label: 'Go to First Scene',
        description: 'Navigate to the start scene',
        icon: '🏠',
        category: 'navigation',
        keywords: ['start', 'beginning', 'home'],
        disabled: !firstSceneId,
        action: () => {
          if (firstSceneId) {
            setCurrentSceneId(firstSceneId);
          }
        },
      },
      {
        id: 'scene:next',
        label: 'Next Scene',
        description: 'Go to the next scene in order',
        icon: '➡️',
        shortcut: 'Ctrl+]',
        category: 'navigation',
        keywords: ['forward', 'next'],
        action: () => {
          const currentIndex = scenes.findIndex((s) => s.id === currentSceneId);
          if (currentIndex >= 0 && currentIndex < scenes.length - 1) {
            setCurrentSceneId(scenes[currentIndex + 1].id);
          }
        },
      },
      {
        id: 'scene:previous',
        label: 'Previous Scene',
        description: 'Go to the previous scene in order',
        icon: '⬅️',
        shortcut: 'Ctrl+[',
        category: 'navigation',
        keywords: ['back', 'previous'],
        action: () => {
          const currentIndex = scenes.findIndex((s) => s.id === currentSceneId);
          if (currentIndex > 0) {
            setCurrentSceneId(scenes[currentIndex - 1].id);
          }
        },
      },
    ];

    commands.forEach(registerCommand);

    return () => {
      commands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [
    registerCommand,
    unregisterCommand,
    scenes,
    currentSceneId,
    firstSceneId,
    projectId,
    addScene,
    deleteScene,
    setCurrentSceneId,
  ]);

  // Scene quick navigation commands
  useEffect(() => {
    const sceneCommands: Command[] = scenes.slice(0, 10).map((scene, index) => ({
      id: `scene:goto-${scene.id}`,
      label: scene.name || `Scene ${index + 1}`,
      description: scene.description || 'Navigate to this scene',
      icon: scene.id === firstSceneId ? '🏠' : '📄',
      category: 'navigation',
      keywords: ['go', 'navigate', scene.name?.toLowerCase() || ''],
      action: () => {
        setCurrentSceneId(scene.id);
      },
    }));

    sceneCommands.forEach(registerCommand);

    return () => {
      sceneCommands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [scenes, firstSceneId, registerCommand, unregisterCommand, setCurrentSceneId]);
}
