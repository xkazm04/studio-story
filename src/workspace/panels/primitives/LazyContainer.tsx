'use client';

import React, { Suspense } from 'react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps } from './types';

interface LazyErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <PanelErrorState
          message={this.state.errorMessage ?? 'Component failed to load'}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

interface LazyContainerProps extends BasePrimitiveProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  componentProps?: Record<string, unknown>;
  isEmpty?: boolean;
}

export default function LazyContainer({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onTriggerSkill,
  component: Component,
  componentProps,
  isEmpty,
  density,
}: LazyContainerProps) {
  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      actions={actions}
      density={density}
    >
      {isLoading ? (
        <PanelSkeletonList rows={4} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : isEmpty ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'Nothing here yet'}
          description={emptyDescription}
          action={
            onTriggerSkill ? (
              <button
                type="button"
                onClick={() => onTriggerSkill('create')}
                className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
              >
                Get Started
              </button>
            ) : undefined
          }
        />
      ) : (
        <LazyErrorBoundary onRetry={onRetry}>
          <Suspense fallback={<PanelSkeletonList rows={4} />}>
            <Component {...(componentProps ?? {})} />
          </Suspense>
        </LazyErrorBoundary>
      )}
    </PanelFrame>
  );
}
