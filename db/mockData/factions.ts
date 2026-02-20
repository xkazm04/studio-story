/**
 * Mock Factions Data
 */

import { Faction, FactionRelationship } from '@/app/types/Faction';

export const mockFactions: Faction[] = [
  {
    id: 'faction-1',
    name: 'The Silver Order',
    description: 'Ancient order of knights sworn to protect the realm',
    project_id: 'proj-1',
    color: '#3b82f6',
    logo_url: '',
  },
  {
    id: 'faction-2',
    name: 'Dragon Clan',
    description: 'Nomadic warriors who ride dragons',
    project_id: 'proj-1',
    color: '#ef4444',
    logo_url: '',
  },
  {
    id: 'faction-3',
    name: 'Shadow Guild',
    description: 'Secretive organization of spies and assassins',
    project_id: 'proj-1',
    color: '#6b7280',
    logo_url: '',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'faction-4',
    name: 'Jedi Order',
    description: 'Ancient order of Force-sensitive peacekeepers who serve the Galactic Republic. Guardians of peace and justice, trained in the ways of the Light Side of the Force.',
    project_id: 'proj-4',
    color: '#2563eb',
    logo_url: '',
  },
];

export const mockFactionRelationships: FactionRelationship[] = [
  {
    id: 'frel-1',
    faction_a_id: 'faction-1',
    faction_b_id: 'faction-2',
    description: 'Uneasy truce after centuries of war. Trade agreement in place.',
    relationship_type: 'neutral',
  },
  {
    id: 'frel-2',
    faction_a_id: 'faction-1',
    faction_b_id: 'faction-3',
    description: 'The Silver Order hunts Shadow Guild members. Deep mistrust.',
    relationship_type: 'negative',
  },
];
