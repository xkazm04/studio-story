/**
 * useContextPins — React hook for managing persistent context pins.
 *
 * Provides CRUD operations and query state for context pins scoped to a project.
 * Pins auto-inject into AI generation context at priority 1.0.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/app/utils/api';
import type { ContextPin, ContextPinType, ContextPinScope } from '@/app/types/ContextPin';

const PINS_BASE_URL = '/api/context-pins';

function pinsQueryKey(projectId: string) {
  return ['context-pins', projectId];
}

export interface CreatePinInput {
  project_id: string;
  pin_type: ContextPinType;
  label: string;
  content: string;
  scope?: ContextPinScope;
  scope_target_id?: string | null;
  enabled?: boolean;
  sort_order?: number;
}

export interface UpdatePinInput {
  id: string;
  pin_type?: ContextPinType;
  label?: string;
  content?: string;
  scope?: ContextPinScope;
  scope_target_id?: string | null;
  enabled?: boolean;
  sort_order?: number;
}

export function useContextPins(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const key = pinsQueryKey(projectId ?? '');

  const query = useQuery<ContextPin[]>({
    queryKey: key,
    queryFn: ({ signal }) =>
      apiFetch<ContextPin[]>({
        url: `${PINS_BASE_URL}?projectId=${projectId}`,
        signal,
      }),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const createPin = useMutation({
    mutationFn: (input: CreatePinInput) =>
      apiFetch<ContextPin>({
        url: PINS_BASE_URL,
        method: 'POST',
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const updatePin = useMutation({
    mutationFn: ({ id, ...updates }: UpdatePinInput) =>
      apiFetch<ContextPin>({
        url: `${PINS_BASE_URL}/${id}`,
        method: 'PUT',
        body: updates,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const deletePin = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>({
        url: `${PINS_BASE_URL}/${id}`,
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const togglePin = useMutation({
    mutationFn: (pin: ContextPin) =>
      apiFetch<ContextPin>({
        url: `${PINS_BASE_URL}/${pin.id}`,
        method: 'PUT',
        body: { enabled: !pin.enabled },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  /** Get only enabled pins (for injection into AI context) */
  const enabledPins = (query.data ?? []).filter((p) => p.enabled);

  return {
    pins: query.data ?? [],
    enabledPins,
    isLoading: query.isLoading,
    error: query.error,
    createPin,
    updatePin,
    deletePin,
    togglePin,
  };
}
