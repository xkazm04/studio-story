import { useQuery } from '@tanstack/react-query';
import { Beat } from '../../types/Beat';
import { apiFetch, useApiGet, API_BASE_URL, USE_MOCK_DATA } from '../../utils/api';

const BEATS_URL = `${API_BASE_URL}/beats`;

// Mock beats data for development/testing
const MOCK_BEATS: Beat[] = [
    {
        id: 'beat-1',
        name: 'Opening Hook',
        description: 'Establish the world and introduce the protagonist in their ordinary life.',
        type: 'story',
        project_id: 'proj-1',
        order: 0,
        completed: true,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-2',
        name: 'Inciting Incident',
        description: 'Something disrupts the status quo and sets the story in motion.',
        type: 'story',
        project_id: 'proj-1',
        order: 1,
        completed: true,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-3',
        name: 'First Plot Point',
        description: 'The protagonist makes a choice that locks them into the central conflict.',
        type: 'story',
        project_id: 'proj-1',
        order: 2,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-4',
        name: 'Rising Action',
        description: 'Stakes escalate as the protagonist faces increasing challenges.',
        type: 'story',
        project_id: 'proj-1',
        order: 3,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-5',
        name: 'Midpoint',
        description: 'A major revelation or reversal that changes everything.',
        type: 'story',
        project_id: 'proj-1',
        order: 4,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-6',
        name: 'All Is Lost',
        description: 'The protagonist hits rock bottom; victory seems impossible.',
        type: 'story',
        project_id: 'proj-1',
        order: 5,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-7',
        name: 'Climax',
        description: 'The final confrontation where everything comes together.',
        type: 'story',
        project_id: 'proj-1',
        order: 6,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
    {
        id: 'beat-8',
        name: 'Resolution',
        description: 'The aftermath and new status quo after the conflict is resolved.',
        type: 'story',
        project_id: 'proj-1',
        order: 7,
        completed: false,
        default_flag: true,
        created_at: new Date('2024-01-01'),
    },
];

// Hook to get mock beats
const useMockBeats = (projectId: string | undefined, enabled: boolean = true) => {
    return useQuery<Beat[]>({
        queryKey: ['mock-beats', projectId],
        queryFn: async () => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            return projectId ? MOCK_BEATS.filter(b => b.project_id === 'proj-1') : [];
        },
        enabled: enabled && !!projectId,
    });
};

export const beatApi = {
    // Get all beats for a project
    useGetBeats: (projectId: string | undefined, enabled: boolean = true) => {
        // Use mock data if USE_MOCK_DATA is enabled
        if (USE_MOCK_DATA) {
            return useMockBeats(projectId, enabled);
        }

        const url = projectId ? `${BEATS_URL}?projectId=${projectId}` : '';
        return useApiGet<Beat[]>(url, enabled && !!projectId);
    },

    // Get beats for a specific act
    useGetActBeats: (actId: string | undefined, enabled: boolean = true) => {
        if (USE_MOCK_DATA) {
            return useQuery<Beat[]>({
                queryKey: ['mock-beats-act', actId],
                queryFn: async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    return actId ? MOCK_BEATS.filter(b => b.type === 'act') : [];
                },
                enabled: enabled && !!actId,
            });
        }

        if (!actId) return useApiGet<Beat[]>('', false);
        const url = `${BEATS_URL}?actId=${actId}`;
        return useApiGet<Beat[]>(url, enabled && !!actId);
    },

    // Create a story beat
    createStoryBeat: async (data: {
        name: string;
        project_id: string;
        description?: string;
    }) => {
        if (USE_MOCK_DATA) {
            const newBeat: Beat = {
                id: `beat-${Date.now()}`,
                ...data,
                type: 'story',
                order: MOCK_BEATS.length,
                completed: false,
                created_at: new Date(),
            };
            MOCK_BEATS.push(newBeat);
            return newBeat;
        }

        return apiFetch<Beat>({
            url: BEATS_URL,
            method: 'POST',
            body: { ...data, type: 'story' },
        });
    },

    // Create an act beat
    createActBeat: async (data: {
        name: string;
        project_id: string;
        act_id: string;
        description?: string;
    }) => {
        if (USE_MOCK_DATA) {
            const newBeat: Beat = {
                id: `beat-${Date.now()}`,
                ...data,
                type: 'act',
                order: MOCK_BEATS.filter(b => b.type === 'act').length,
                completed: false,
                created_at: new Date(),
            };
            MOCK_BEATS.push(newBeat);
            return newBeat;
        }

        return apiFetch<Beat>({
            url: BEATS_URL,
            method: 'POST',
            body: { ...data, type: 'act' },
        });
    },

    // Update a beat
    editBeat: async (id: string, field: string, value: string | number | boolean) => {
        if (USE_MOCK_DATA) {
            const beat = MOCK_BEATS.find(b => b.id === id);
            if (beat) {
                (beat as any)[field] = value;
            }
            return beat as Beat;
        }

        return apiFetch<Beat>({
            url: `${BEATS_URL}/${id}`,
            method: 'PUT',
            body: { [field]: value },
        });
    },

    // Delete a beat
    deleteBeat: async (id: string) => {
        if (USE_MOCK_DATA) {
            const index = MOCK_BEATS.findIndex(b => b.id === id);
            if (index > -1) MOCK_BEATS.splice(index, 1);
            return;
        }

        return apiFetch<void>({
            url: `${BEATS_URL}/${id}`,
            method: 'DELETE',
        });
    },

    // Delete all beats for a project
    deleteAllBeats: async (projectId: string) => {
        if (USE_MOCK_DATA) {
            const indices = MOCK_BEATS.map((b, i) => b.project_id === projectId ? i : -1).filter(i => i >= 0);
            indices.reverse().forEach(i => MOCK_BEATS.splice(i, 1));
            return;
        }

        return apiFetch<void>({
            url: `${BEATS_URL}/project/${projectId}`,
            method: 'DELETE',
        });
    },
};
