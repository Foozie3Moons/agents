import { useQuery } from '@tanstack/react-query';
import { httpClient } from './httpClient.js';

export interface Health {
  status: 'ok' | 'degraded';
}

// Query keys: ['resource', ...ids]. Mutations invalidate the one entry they change.
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => httpClient.get<Health>('/health'),
  });
}
