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
import { FilesService } from 'src/common/files/files.services';
import { MediaDir } from 'src/common/files/media-dir-.enum';
import { LocationService } from 'src/modules/locations/location.service';
import { FilterRequestDto } from '../dto/filter-request.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(ServiceRequestsEntity)
    private serviceRequestsRepository: Repository<ServiceRequestsEntity>,
    private usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly locationService: LocationService,
    private readonly paginatorService: PaginatorService,
  ) {}

  async createServiceRequest(createServiceRequestDto: CreateServiceRequestDto, userId: number, media: Express.Multer.File[], lang: LanguagesEnum): Promise<ServiceRequestsEntity> {
    const user = await this.usersService.findById(userId);
    const requestNumber = `REQ-${uuidv4().split('-')[0]}`;
    
    const {images, location, ...dtoWithoutImages} = createServiceRequestDto;
    let imagesPath = [];
    if (media && media.length > 0) {
      await Promise.all(
        media.map(async (file) => {
          const filePath = await this.filesService.saveFile(file, MediaDir.REQUESTS);
          imagesPath.push(filePath);
        })
      );
    }

    
    const serviceRequest = this.serviceRequestsRepository.create({
      ...dtoWithoutImages,
      requestNumber,
      user,
      media: imagesPath,
    });

    if (location) {
      let parsedLocation = location as any;
      if (typeof location === 'string') {
        try {
        parsedLocation = JSON.parse(location);
      } catch {
        throw new BadRequestException('Invalid location format');
      }
      }
      const { latitude, longitude, address } = parsedLocation;
      
      let saveLocation = null;
      if(address){
          saveLocation = await this.locationService.getLatLongFromText(address, lang);
        }else{
          saveLocation = await this.locationService.geolocationAddress(latitude, longitude);
      }

      serviceRequest.latitude  = saveLocation.latitude;
      serviceRequest.longitude = saveLocation.longitude;
      serviceRequest.arAddress = saveLocation.ar_address;
      serviceRequest.enAddress = saveLocation.en_address;
    }

    return this.serviceRequestsRepository.save(serviceRequest);
  }

  async findAllServiceRequests(filter: FilterRequestDto){
    const page = filter.page || 1;
    const take = filter.limit || 10;

    const query = this.serviceRequestsRepository.createQueryBuilder('serviceRequest')
      .leftJoinAndSelect('serviceRequest.user', 'user')
      .leftJoinAndSelect('serviceRequest.technician', 'technician')
      .leftJoinAndSelect('serviceRequest.offers', 'offers')
      .leftJoinAndSelect('offers.technician', 'offerTechnician')
      .leftJoinAndSelect('serviceRequest.media', 'media')
      .orderBy('serviceRequest.createdAt', 'DESC')

    if (filter.status) {
      query.andWhere('serviceRequest.status = :status', { status: filter.status });
    }

    if (filter.serviceId) {
      query.andWhere('serviceRequest.serviceId = :serviceId', { serviceId: filter.serviceId });
    }

    if (filter.search) {
      query.andWhere(
        '(user.username ILIKE :search OR serviceRequest.arAddress ILIKE :search OR serviceRequest.enAddress ILIKE :search)',
        { search: `%${filter.search}%` }
      );
    }
    query.skip((filter.page - 1) * filter.limit).take(filter.limit);
    const [result, total] = await query.getManyAndCount();

    return this.paginatorService.makePaginate(result, total, take, page);
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