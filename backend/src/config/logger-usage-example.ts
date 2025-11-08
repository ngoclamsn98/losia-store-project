/**
 * HƯỚNG DẪN SỬ DỤNG WINSTON LOGGER TRONG PROJECT
 * 
 * File này chứa các ví dụ về cách sử dụng Winston logger trong NestJS.
 * Logger đã được cấu hình để chỉ log ra console, không ghi file.
 */

import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ExampleService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // Ví dụ 1: Log thông tin cơ bản
  exampleBasicLogging() {
    // Log level: info
    this.logger.info('This is an info message', { context: 'ExampleService' });

    // Log level: warn
    this.logger.warn('This is a warning message', { context: 'ExampleService' });

    // Log level: error
    this.logger.error('This is an error message', { context: 'ExampleService' });

    // Log level: debug
    this.logger.debug('This is a debug message', { context: 'ExampleService' });
  }

  // Ví dụ 2: Log với metadata
  exampleLoggingWithMetadata() {
    this.logger.info('User logged in', {
      context: 'AuthService',
      userId: '123',
      email: 'user@example.com',
      timestamp: new Date().toISOString(),
    });
  }

  // Ví dụ 3: Log lỗi với stack trace
  exampleErrorLogging() {
    try {
      throw new Error('Something went wrong!');
    } catch (error) {
      this.logger.error('An error occurred', {
        context: 'ExampleService',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // Ví dụ 4: Log trong các operations
  async exampleOperationLogging() {
    this.logger.info('Starting operation', { context: 'ExampleService' });

    try {
      // Thực hiện operation
      const result = await this.someOperation();
      
      this.logger.info('Operation completed successfully', {
        context: 'ExampleService',
        result,
      });

      return result;
    } catch (error) {
      this.logger.error('Operation failed', {
        context: 'ExampleService',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private async someOperation() {
    return { success: true };
  }
}

/**
 * CÁC LOG LEVELS:
 * - error: Lỗi nghiêm trọng
 * - warn: Cảnh báo
 * - info: Thông tin chung (mặc định)
 * - debug: Thông tin debug (chỉ hiển thị khi LOG_LEVEL=debug)
 * 
 * CẤU HÌNH LOG LEVEL:
 * Thêm vào file .env:
 * LOG_LEVEL=info  # hoặc debug, warn, error
 * 
 * CÁCH SỬ DỤNG TRONG SERVICE:
 * 
 * 1. Import Logger và WINSTON_MODULE_PROVIDER:
 *    import { Inject } from '@nestjs/common';
 *    import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
 *    import { Logger } from 'winston';
 * 
 * 2. Inject logger vào constructor:
 *    constructor(
 *      @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
 *    ) {}
 * 
 * 3. Sử dụng logger:
 *    this.logger.info('Message', { context: 'ServiceName', ...metadata });
 */

