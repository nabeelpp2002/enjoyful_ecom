import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Connection } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({
    summary: 'Check API process health without querying the database',
  })
  checkProcess() {
    return { status: 'ok' };
  }

  @Get('db')
  @ApiOperation({ summary: 'Check API and MongoDB connectivity' })
  async checkDatabase() {
    const startedAt = Date.now();

    try {
      await this.connection.asPromise();
      const db = this.connection.db;
      if (!db) throw new Error('MongoDB connection is not initialized');
      await db.admin().ping();

      return {
        status: 'ok',
        database: 'mongodb',
        responseTimeMs: Date.now() - startedAt,
      };
    } catch {
      throw new ServiceUnavailableException('Database health check failed');
    }
  }
}
