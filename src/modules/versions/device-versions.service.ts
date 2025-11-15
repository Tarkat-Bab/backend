import { Injectable } from '@nestjs/common';
import { DashboardDeviceVersionsService } from 'src/dashboard/settings/services/device-versions.service';

@Injectable()
export class DeviceVersionsService {
  constructor(
    private readonly deviceVersionsService: DashboardDeviceVersionsService,
  ) {}

  async getLatest() {
    return await this.deviceVersionsService.getLatest();
  }
}
