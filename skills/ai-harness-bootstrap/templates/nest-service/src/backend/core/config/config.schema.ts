import { z } from 'zod';

export const AppConfigSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  databasePath: z.string().default('./data/app.db'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
