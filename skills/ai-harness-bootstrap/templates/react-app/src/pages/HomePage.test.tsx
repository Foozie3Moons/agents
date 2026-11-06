import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage.js';

// Fresh client per test, retry off: default retries make error cases slow and flaky.
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('HomePage', () => {
  it('renders the heading', () => {
    render(<HomePage />, { wrapper });
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });
});
