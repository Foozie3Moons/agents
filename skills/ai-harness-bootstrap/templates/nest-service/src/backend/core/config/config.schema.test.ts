import { describe, expect, it } from '@rstest/core';
import { AppConfigSchema } from './config.schema.js';

describe('AppConfigSchema', () => {
  it('applies defaults', () => {
    expect(AppConfigSchema.parse({}).port).toBe(3000);
  });

  it('rejects a non-numeric port', () => {
    expect(() => AppConfigSchema.parse({ port: 'abc' })).toThrow();
  });
});
