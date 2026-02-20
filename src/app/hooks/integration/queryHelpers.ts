import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useApiGet, USE_MOCK_DATA } from '../../utils/api';
import { simulateApiCall } from '../../../../db/mockData';

/**
 * Shared configuration for all queries
 */
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Creates a query hook that handles both mock and real API data
 */
export function createMockableQuery<T>(
  queryKey: (string | undefined)[],
  mockDataFn: () => Promise<T>,
  apiUrl: string,
  enabled: boolean = true
): UseQueryResult<T> {
  if (USE_MOCK_DATA) {
    return useQuery<T>({
      queryKey,
      queryFn: mockDataFn,
      enabled,
      ...DEFAULT_QUERY_CONFIG,
    });
  }
  return useApiGet<T>(apiUrl, enabled);
}

/**
 * Helper to create mock query function with simulated API call
 */
export async function createMockQueryFn<T>(data: T): Promise<T> {
  return simulateApiCall(data);
}

/**
 * Helper to create filtered mock query function
 */
export async function createFilteredMockQueryFn<T>(
  mockData: T[],
  filterFn: (item: T) => boolean
): Promise<T[]> {
  const filtered = mockData.filter(filterFn);
  return simulateApiCall(filtered);
}

/**
 * Helper to create single item mock query function
 */
export async function createSingleMockQueryFn<T>(
  mockData: T[],
  findFn: (item: T) => boolean,
  errorMessage: string = 'Item not found'
): Promise<T> {
  const item = mockData.find(findFn);
  if (!item) throw new Error(errorMessage);
  return simulateApiCall(item);
}
