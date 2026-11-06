import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge.js';

describe('StatusBadge', () => {
  it('renders the label as a status', () => {
    render(<StatusBadge label="ok" tone="good" />);
    expect(screen.getByRole('status')).toHaveTextContent('ok');
  });
});
