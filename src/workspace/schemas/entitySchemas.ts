import type { EntitySchema } from './types';

export const CHARACTER_SCHEMA: EntitySchema = {
  entity: 'character',
  displayName: 'Character',
  displayNamePlural: 'Characters',
  fields: [
    { key: 'avatar_url', label: 'Avatar', type: 'avatar', displayIn: ['card', 'list-item'] },
    { key: 'name', label: 'Name', type: 'text', displayIn: ['card', 'list-item', 'detail'], sortable: true },
    { key: 'type', label: 'Type', type: 'badge', displayIn: ['card', 'list-item'], sortable: true, filterable: true },
  ],
  defaultView: 'card-grid',
  icon: 'Users',
  accentColor: 'cyan',
  domain: 'character',
  searchField: 'name',
  titleField: 'name',
  subtitleField: 'type',
  imageField: 'avatar_url',
};

export const SCENE_SCHEMA: EntitySchema = {
  entity: 'scene',
  displayName: 'Scene',
  displayNamePlural: 'Scenes',
  fields: [
    { key: 'image_url', label: 'Image', type: 'image', displayIn: ['card'] },
    { key: 'name', label: 'Name', type: 'text', displayIn: ['card', 'list-item', 'detail'], sortable: true },
    { key: 'description', label: 'Description', type: 'text', displayIn: ['card', 'list-item'], truncate: true },
    { key: 'order', label: 'Order', type: 'number', displayIn: ['detail'], sortable: true, filterable: true },
    { key: 'act_id', label: 'Act', type: 'text', displayIn: ['detail'], filterable: true },
    { key: 'created_at', label: 'Created', type: 'date', displayIn: ['detail'], sortable: true, filterable: true },
    { key: 'updated_at', label: 'Updated', type: 'date', displayIn: ['detail'] },
  ],
  defaultView: 'data-list',
  icon: 'Film',
  accentColor: 'amber',
  domain: 'scene',
  searchField: 'name',
  titleField: 'name',
  subtitleField: 'description',
  imageField: 'image_url',
};

export const BEAT_SCHEMA: EntitySchema = {
  entity: 'beat',
  displayName: 'Beat',
  displayNamePlural: 'Beats',
  fields: [
    { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'], sortable: true },
    { key: 'type', label: 'Type', type: 'badge', displayIn: ['list-item'], sortable: true, filterable: true },
    { key: 'description', label: 'Description', type: 'text', displayIn: ['list-item'], truncate: true },
  ],
  defaultView: 'data-list',
  icon: 'ListChecks',
  accentColor: 'violet',
  domain: 'story',
  titleField: 'name',
  subtitleField: 'description',
};

export const ACT_SCHEMA: EntitySchema = {
  entity: 'act',
  displayName: 'Act',
  displayNamePlural: 'Acts',
  fields: [
    { key: 'name', label: 'Name', type: 'text', displayIn: ['tree-node'] },
    { key: 'description', label: 'Description', type: 'text', displayIn: ['detail'] },
    { key: 'order', label: 'Order', type: 'number', displayIn: ['detail'] },
  ],
  defaultView: 'tree-view',
  icon: 'Map',
  accentColor: 'violet',
  domain: 'story',
  titleField: 'name',
  subtitleField: 'description',
};

export const FACTION_SCHEMA: EntitySchema = {
  entity: 'faction',
  displayName: 'Faction',
  displayNamePlural: 'Factions',
  fields: [
    { key: 'name', label: 'Name', type: 'text', displayIn: ['card', 'list-item'] },
    { key: 'description', label: 'Description', type: 'text', displayIn: ['card'], truncate: true },
    { key: 'color', label: 'Color', type: 'text', displayIn: ['card'] },
  ],
  defaultView: 'card-grid',
  icon: 'Shield',
  accentColor: 'rose',
  domain: 'character',
  searchField: 'name',
  titleField: 'name',
  subtitleField: 'description',
};

export const VOICE_SCHEMA: EntitySchema = {
  entity: 'voice',
  displayName: 'Voice',
  displayNamePlural: 'Voices',
  fields: [
    { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'], sortable: true },
    { key: 'provider', label: 'Provider', type: 'badge', displayIn: ['list-item'], sortable: true, filterable: true },
  ],
  defaultView: 'data-list',
  icon: 'Mic',
  accentColor: 'emerald',
  domain: 'utility',
  titleField: 'name',
  subtitleField: 'provider',
};
