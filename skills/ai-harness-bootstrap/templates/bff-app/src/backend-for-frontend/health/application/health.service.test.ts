import { describe, expect, it } from 'vitest';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports ok', () => {
    expect(new HealthService().report()).toEqual({ status: 'ok' });
  });
});
