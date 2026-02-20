/**
 * Mock Projects Data
 */

import { Project } from '@/app/types/Project';
import { MOCK_USER_ID } from './constants';

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Epic Fantasy Saga',
    description: 'A tale of dragons, magic, and ancient prophecies',
    user_id: MOCK_USER_ID,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  },
  {
    id: 'proj-2',
    name: 'Cyberpunk Chronicles',
    description: 'Dark future, neon lights, and corporate espionage',
    user_id: MOCK_USER_ID,
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-10T12:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Mystery at Moonlight Manor',
    description: 'A detective story set in a haunted Victorian mansion',
    user_id: MOCK_USER_ID,
    created_at: '2024-03-05T14:00:00Z',
    updated_at: '2024-03-05T14:00:00Z',
  },
  {
    id: 'proj-4',
    name: 'Ashes of the Outer Rim',
    description: 'A Star Wars story set during the twilight of the Old Republic. Two Jedi investigators uncover a trail of dark side corruption reaching from a destroyed farming village to the heart of the Senate.',
    user_id: MOCK_USER_ID,
    created_at: '2024-04-01T09:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
];
