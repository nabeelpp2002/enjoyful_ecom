import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get global store settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update global store settings (admin)' })
  async updateSettings(@Body() body: { showProductPrices?: boolean }) {
    return this.settingsService.updateSettings(body);
  }
}
