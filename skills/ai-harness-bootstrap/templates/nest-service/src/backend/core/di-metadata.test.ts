import 'reflect-metadata';
import { Inject, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from '@rstest/core';

// Canary for the test compiler. If this file goes red, the runner stopped
// emitting decorator metadata and every DI test in the repo is lying.

@Injectable()
class NeedsNumber {
  constructor(readonly n: number) {}
}

const LIMIT = Symbol('LIMIT');

@Injectable()
class NeedsToken {
  constructor(@Inject(LIMIT) readonly n: number) {}
}

describe('decorator metadata under the test compiler', () => {
  it('emits design:paramtypes', () => {
    expect(Reflect.getMetadata('design:paramtypes', NeedsNumber)).toEqual([Number]);
  });

  it('a missing @Inject() fails module compilation, as it does at boot', async () => {
    await expect(Test.createTestingModule({ providers: [NeedsNumber] }).compile()).rejects.toThrow(
      /Nest can't resolve dependencies/,
    );
  });

  it('with @Inject(token) the same shape resolves', async () => {
    const mod = await Test.createTestingModule({
      providers: [NeedsToken, { provide: LIMIT, useValue: 3 }],
    }).compile();
    expect(mod.get(NeedsToken).n).toBe(3);
  });
});
