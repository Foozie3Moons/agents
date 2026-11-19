import { z } from 'zod';

/** Canonical row schema for `app_meta`: its keys are exactly the table's columns. */
export const AppMetaRow = z.object({
  key: z.string(),
  value: z.string(),
});
export type AppMetaRow = z.infer<typeof AppMetaRow>;
