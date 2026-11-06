import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';

// BFF composition root. app.module.ts imports this and nothing else from the BFF tree.
@Module({
  imports: [HealthModule],
})
export class BffModule {}
