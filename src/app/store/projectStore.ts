/**
 * Legacy projectStore.ts - Backward Compatibility Layer
 *
 * This file has been migrated to the slices architecture.
 * For new code, please import from '@/app/store/slices/projectSlice' directly.
 *
 * This file re-exports everything from projectSlice.ts to maintain backward
 * compatibility with any code that might still import from './projectStore'.
 *
 * @deprecated Use '@/app/store/slices/projectSlice' or '@/app/store' instead
 */

// Re-export everything from the slice
export { useProjectStore, type ProjectState } from './slices/projectSlice';
