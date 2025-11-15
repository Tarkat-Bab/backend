import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardSettingsService } from '../services/settings.service';
import { UpdateSettingDto } from '../dtos/update-settings.dto';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/settings')
export class DashboardSettingsController {
  constructor(private service: DashboardSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the settings' })
  getSetting() {
    return this.service.getSetting();
  }

  @Patch()
  @ApiOperation({ summary: 'Update setting' })
  update(@Body() dto: UpdateSettingDto) {
    return this.service.updateSettings(dto);
  }
}
