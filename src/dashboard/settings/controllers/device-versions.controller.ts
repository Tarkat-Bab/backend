import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardDeviceVersionsService } from '../services/device-versions.service';
import { CreateDeviceVersionDto } from '../dtos/create-device-versions.dto';
import { UpdateDeviceVersionDto } from '../dtos/update-device-versions.dto';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/device-versions')
export class DashboardDeviceVersionsController {
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

  @Patch()
  @ApiOperation({ summary: 'Update version settings by ID' })
  update( @Body() dto: UpdateDeviceVersionDto) {
    return this.service.update(dto);
  }
}
