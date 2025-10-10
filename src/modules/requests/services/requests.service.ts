import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { UpdateServiceRequestDto } from '../dto/update-service-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { RequestStatus } from '../enums/requestStatus.enum';
import { UsersService } from '../../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { RequestsMedia } from '../entities/request_media.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(ServiceRequestsEntity)
    private serviceRequestsRepository: Repository<ServiceRequestsEntity>,
    private usersService: UsersService,
  ) {}

  async createServiceRequest(createServiceRequestDto: CreateServiceRequestDto, userId: number, images: Express.Multer.File[]): Promise<ServiceRequestsEntity> {
    const user = await this.usersService.findById(userId);
    const requestNumber = `REQ-${uuidv4().split('-')[0]}`;

    const serviceRequest = this.serviceRequestsRepository.create({
      ...createServiceRequestDto,
      requestNumber,
      user,
    });

    return this.serviceRequestsRepository.save(serviceRequest);
  }

  async findAllServiceRequests(): Promise<ServiceRequestsEntity[]> {
    return this.serviceRequestsRepository.find({
      relations: ['user', 'technician', 'offers', 'offers.technician', 'media'],
    });
  }

  async findServiceRequestById(id: number, lang: LanguagesEnum): Promise<ServiceRequestsEntity> {
    const request = await this.serviceRequestsRepository.findOne({
      where: { id },
      relations: ['user', 'technician', 'offers', 'offers.technician', 'media'],
    });

    if (!request) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }

    return request;
  }

  async updateServiceRequest(id: number, updateServiceRequestDto: UpdateServiceRequestDto): Promise<ServiceRequestsEntity> {
    const request = await this.findServiceRequestById(id, LanguagesEnum.ENGLISH);
    
    if (updateServiceRequestDto.technicianId) {
      const technician = await this.usersService.findById(updateServiceRequestDto.technicianId);
      request.technician = technician;
      delete updateServiceRequestDto.technicianId;
    }

    Object.assign(request, updateServiceRequestDto);
    return this.serviceRequestsRepository.save(request);
  }

  async removeServiceRequest(id: number): Promise<void> {
    const result = await this.serviceRequestsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }
  }

  async findServiceRequestsByUserId(userId: number): Promise<ServiceRequestsEntity[]> {
    return this.serviceRequestsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'technician', 'offers', 'offers.technician', 'media'],
    });
  }

  async findServiceRequestsByTechnicianId(technicianId: number): Promise<ServiceRequestsEntity[]> {
    return this.serviceRequestsRepository.find({
      where: { technician: { id: technicianId } },
      relations: ['user', 'technician', 'offers', 'offers.technician', 'media'],
    });
  }

  async changeRequestStatus(id: number, status: RequestStatus): Promise<ServiceRequestsEntity> {
    const request = await this.findServiceRequestById(id, LanguagesEnum.ENGLISH);
    request.status = status;
    return this.serviceRequestsRepository.save(request);
  }
}