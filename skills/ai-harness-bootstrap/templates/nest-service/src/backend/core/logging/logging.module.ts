import { Inject, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { APP_CONFIG } from '../config/app.config.js';
import type { AppConfig } from '../config/config.schema.js';

// Module code logs with `new Logger(ClassName.name)` from @nestjs/common;
// main.ts routes it here via app.useLogger(). Never log raw user content.
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    }),
  ],
})
export class LoggingModule {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}
}
