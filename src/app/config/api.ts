// API Configuration
// Toggle between mock data and real Supabase backend
// Set to false to use Supabase (requires .env.local configuration)
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

