/**
 * Mock Faction Media Data
 */

import { FactionMedia } from '@/app/types/Faction';
import { MOCK_USER_ID } from './constants';

export const mockFactionMedia: FactionMedia[] = [
  {
    id: 'media-1',
    faction_id: 'faction-1',
    type: 'logo',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop',
    uploaded_at: '2024-01-15T10:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'The Silver Order official logo',
  },
  {
    id: 'media-2',
    faction_id: 'faction-1',
    type: 'banner',
    url: 'https://images.unsplash.com/photo-1451847251646-8a6c0dd1510c?w=800&h=400&fit=crop',
    uploaded_at: '2024-01-16T11:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Silver Order banner for ceremonial events',
  },
  {
    id: 'media-3',
    faction_id: 'faction-1',
    type: 'emblem',
    url: 'https://images.unsplash.com/photo-1589254066213-a0c9dc853511?w=400&h=400&fit=crop',
    uploaded_at: '2024-01-17T14:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Silver knight emblem worn by all members',
  },
  {
    id: 'media-4',
    faction_id: 'faction-1',
    type: 'screenshot',
    url: 'https://images.unsplash.com/photo-1486915585738-e7e93d334cc2?w=600&h=400&fit=crop',
    uploaded_at: '2024-01-18T09:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'The Silver Fortress at dawn',
  },
  {
    id: 'media-5',
    faction_id: 'faction-2',
    type: 'logo',
    url: 'https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?w=400&h=400&fit=crop',
    uploaded_at: '2024-01-19T10:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Dragon Clan emblem',
  },
  {
    id: 'media-6',
    faction_id: 'faction-2',
    type: 'banner',
    url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&h=400&fit=crop',
    uploaded_at: '2024-01-20T12:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Dragon Clan war banner',
  },
  {
    id: 'media-7',
    faction_id: 'faction-2',
    type: 'screenshot',
    url: 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=600&h=400&fit=crop',
    uploaded_at: '2024-01-21T15:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Dragon riders training in the mountains',
  },
  {
    id: 'media-8',
    faction_id: 'faction-3',
    type: 'logo',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop',
    uploaded_at: '2024-01-22T08:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Shadow Guild secret mark',
  },
  {
    id: 'media-9',
    faction_id: 'faction-3',
    type: 'screenshot',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop',
    uploaded_at: '2024-01-23T19:00:00Z',
    uploader_id: MOCK_USER_ID,
    description: 'Hidden Shadow Guild meeting place',
  },
];
