import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module.js';
import { DatabaseModule } from './core/database/database.module.js';
import { LoggingModule } from './core/logging/logging.module.js';

// Composition root. The only place that may import a transport or the BFF tree.
@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule],
})
export class AppModule {}
