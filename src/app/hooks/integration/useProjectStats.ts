import { API_BASE_URL } from '../../utils/api';
import { ProjectStats } from '../../api/projectStats/route';
import { mockActs, mockScenes, mockBeats } from '../../../../db/mockData';
import { createMockableQuery, createMockQueryFn } from './queryHelpers';

const PROJECT_STATS_URL = `${API_BASE_URL}/projectStats`;

// Hardcoded targets as specified in OverviewStats component
const TARGET_ACTS = 3;
const TARGET_SCENES = 10;

export const projectStatsApi = {
  // Get unified project statistics
  useProjectStats: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<ProjectStats>(
      ['projectStats', projectId],
      async () => {
        // Calculate stats from mock data
        const projectActs = mockActs.filter(a => a.project_id === projectId);
        const projectScenes = mockScenes.filter(s => s.project_id === projectId);
        const projectBeats = mockBeats.filter(b => b.project_id === projectId);

        const totalBeats = projectBeats.length;
        const completedBeats = projectBeats.filter(beat => beat.completed).length;
        const completionPercentage = totalBeats > 0
          ? Math.round((completedBeats / totalBeats) * 100)
          : 0;

        const stats: ProjectStats = {
          acts: {
            count: projectActs.length,
            target: TARGET_ACTS,
          },
          scenes: {
            count: projectScenes.length,
            target: TARGET_SCENES,
          },
          beats: {
            total: totalBeats,
            completed: completedBeats,
            completionPercentage,
          },
        };

        return createMockQueryFn(stats);
      },
      `${PROJECT_STATS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },
};
