import { Injectable } from '@nestjs/common';

export interface HealthReport {
  readonly status: 'ok' | 'degraded';
}

@Injectable()
export class HealthService {
  report(): HealthReport {
    return { status: 'ok' };
  }
}
