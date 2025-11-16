import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { isPublic } from 'src/common/decorators/public.decorator';
import { UpdateDeviceVersionDto } from 'src/dashboard/settings/dtos/update-device-versions.dto';
import { DashboardDeviceVersionsService } from 'src/dashboard/settings/services/device-versions.service';

@isPublic()
@ApiTags('Device Versions')
@Controller('device-versions')
export class DeviceVersionsController {
  constructor(private service: DashboardDeviceVersionsService) {}


  @Get()
  @ApiOperation({ summary: 'Get the latest version settings' })
  getLatest() {
    return this.service.getLatest();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update version settings by ID' })
  update(@Body() dto: UpdateDeviceVersionDto) {
    return this.service.update(dto);
  }
}
