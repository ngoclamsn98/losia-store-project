import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  getHello(): string {
    // Ví dụ sử dụng logger
    this.logger.info('getHello method called', { context: 'AppService' });
    return 'Hello World!';
  }
}
