import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceVersionsEntity } from '../entities/device-versions.entity';
import { CreateDeviceVersionDto } from '../dtos/create-device-versions.dto';
import { UpdateDeviceVersionDto } from '../dtos/update-device-versions.dto';


@Injectable()
export class DashboardDeviceVersionsService {
  constructor(
    @InjectRepository(DeviceVersionsEntity)
    private readonly repo: Repository<DeviceVersionsEntity>,
  ) {}

  async create(dto: CreateDeviceVersionDto) {
    const version = this.repo.create(dto);
    return this.repo.save(version);
  }

  async getLatest() {
    return await this.repo.findOne({where:{}});;
  }

  async update(dto: UpdateDeviceVersionDto) {
    const versions = await this.getLatest();
    await this.repo.update(versions.id, dto);
    return await this.getLatest();
  }
}
