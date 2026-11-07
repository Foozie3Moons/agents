import { describe, expect, it } from '@rstest/core';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports ok', () => {
    expect(new HealthService().report()).toEqual({ status: 'ok' });
  });
});
