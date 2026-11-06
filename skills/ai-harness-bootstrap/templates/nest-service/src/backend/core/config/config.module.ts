import { Global, Module } from '@nestjs/common';
import { APP_CONFIG } from './app.config.js';
import { AppConfigSchema } from './config.schema.js';

// The only place process.env is read (eslint-rules/no-process-env-outside-config).
// Zod fails closed at boot; everything else injects APP_CONFIG.
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () =>
        AppConfigSchema.parse({
          port: process.env.PORT,
          databasePath: process.env.DATABASE_PATH,
          logLevel: process.env.LOG_LEVEL,
          nodeEnv: process.env.NODE_ENV,
        }),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
