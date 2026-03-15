'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FieldSchema } from '../types';

interface BaseAdapterConfig<TItem extends Record<string, unknown>> {
  title: string;
  icon: LucideIcon;
  headerAccent: 'cyan' | 'amber' | 'violet' | 'emerald' | 'indigo' | 'rose';
  fields: FieldSchema[];
  useData: () => {
    items: TItem[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
    refetch?: () => void;
  };
  toPrimitiveProps?: (ctx: { items: TItem[] }) => Record<string, unknown>;
  primitive: React.ComponentType<Record<string, unknown>>;
}

export function createAdapter<TItem extends Record<string, unknown>>(
  config: BaseAdapterConfig<TItem>
) {
  return function GeneratedAdapter(props: { onClose?: () => void }) {
    const { items, isLoading, isError, errorMessage, refetch } = config.useData();
    const extra = config.toPrimitiveProps?.({ items }) ?? {};
    const Primitive = config.primitive;

    return (
      <Primitive
        title={config.title}
        icon={config.icon}
        headerAccent={config.headerAccent}
        onClose={props.onClose}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={refetch}
        items={items}
        fields={config.fields}
        {...extra}
      />
    );
  };
}
