import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';

export function sortScenes(scenes: Scene[], beats: Beat[]): Scene[] {
  const actOrderMap = new Map<string, number>();
  beats.forEach(beat => {
    if (beat.act_id && beat.order !== undefined) {
      actOrderMap.set(beat.act_id, Math.min(actOrderMap.get(beat.act_id) ?? Infinity, beat.order));
    }
  });

  return [...scenes].sort((a, b) => {
    const orderA = (a.act_id ? actOrderMap.get(a.act_id) : undefined) ?? 0;
    const orderB = (b.act_id ? actOrderMap.get(b.act_id) : undefined) ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  });
}
