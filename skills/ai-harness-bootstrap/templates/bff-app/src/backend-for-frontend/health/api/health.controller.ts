import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService, type HealthReport } from '../application/health.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  get(): HealthReport {
    return this.health.report();
  }
}
