import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, RevenueDataDto, OrderStatusDataDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LevelGuard } from '../common/guards/level.guard';
import { USER_LEVELS } from 'src/common/constants/user-levels.constant';
import { MinLevel } from 'src/common/decorators/min-level.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, LevelGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }

  @Get('revenue')
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Get revenue data for chart (Admin only)' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d'],
    description: 'Time period (7d, 30d, or 90d). Used if startDate and endDate are not provided',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue data retrieved successfully',
    type: [RevenueDataDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  async getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: '7d' | '30d' | '90d',
  ): Promise<RevenueDataDto[]> {
    return this.dashboardService.getRevenue({ startDate, endDate, period });
  }

  @Get('order-status')
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Get order status distribution (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status distribution retrieved successfully',
    type: [OrderStatusDataDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  async getOrderStatus(): Promise<OrderStatusDataDto[]> {
    return this.dashboardService.getOrderStatus();
  }
}

