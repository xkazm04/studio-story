import type { FieldSchema } from '../panels/primitives/types';
import type { HeaderAccent } from '../panels/shared/PanelFrame';
import type { SkillDomain } from '../types';

export type PrimitiveType =
  | 'card-grid'
  | 'data-list'
  | 'tree-view'
  | 'detail-view'
  | 'media-viewer'
  | 'conversation-view'
  | 'lazy-container';

export interface EntitySchema {
  entity: string;
  displayName: string;
  displayNamePlural: string;
  fields: FieldSchema[];
  defaultView: PrimitiveType;
  icon: string;
  accentColor: HeaderAccent;
  domain: SkillDomain;
  searchField?: string;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
}
