/**
 * Mock Data Constants
 */

// Mock User ID (must match src/app/config/mockUser.ts)
export const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Helper functions to simulate API behavior
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulateApiCall = async <T>(data: T, delayMs: number = 300): Promise<T> => {
  await delay(delayMs);
  return data;
};
