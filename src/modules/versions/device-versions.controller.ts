import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateDeviceVersionDto } from 'src/dashboard/settings/dtos/create-device-versions.dto';
import { UpdateDeviceVersionDto } from 'src/dashboard/settings/dtos/update-device-versions.dto';
import { DashboardDeviceVersionsService } from 'src/dashboard/settings/services/device-versions.service';

@ApiBearerAuth()
@ApiTags('Device Versions')
@Controller('device-versions')
export class DeviceVersionsController {
  constructor(private service: DashboardDeviceVersionsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create new device version settings' })
  // create(@Body() dto: CreateDeviceVersionDto) {
  //   return this.service.create(dto);
  // }

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
