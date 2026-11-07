import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from '@rstest/core';

expect.extend(jestDomMatchers);

// RTL registers auto-cleanup only when a global afterEach exists; globals are off, so do it here.
afterEach(() => {
  cleanup();
});
