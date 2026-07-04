import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Public()
  @Post('track')
  track(@Body() dto: TrackEventDto, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.service.track(dto, headers);
  }

  @Get('dashboard')
  @Roles('admin')
  @ApiBearerAuth()
  dashboard(@Query('days') days?: string) {
    const daysBack = days ? Math.max(1, Math.min(90, parseInt(days, 10))) : 7;
    return this.service.dashboard(daysBack);
  }

  @Get('revenue')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  revenue(@Query('daysBack') daysBack?: string) {
    const days = daysBack ? Math.max(1, Math.min(365, parseInt(daysBack, 10))) : 30;
    return this.service.getRevenueStats(days);
  }
}
