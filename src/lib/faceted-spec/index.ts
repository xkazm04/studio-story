// Types
export type {
  FacetDimension,
  FacetGroup,
  FacetOption,
  FacetSelection,
  FacetedSpecConfig,
  FacetedSpecState,
  FacetedSpecSelectors,
  FacetOptionCardProps,
  FacetOptionsListProps,
  FacetHeaderProps,
  FacetPromptEditorProps,
} from './types';

// Store factory
export {
  createFacetedSpecStore,
  createFacetedSpecSelectors,
} from './createFacetedSpecStore';

// UI components
export {
  FacetOptionCard,
  FacetOptionsList,
  FacetHeader,
  FacetPromptEditor,
} from './components';
