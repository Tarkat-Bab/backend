import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { RequestStatus } from '../enums/requestStatus.enum';
import { UsersService } from '../../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilesService } from 'src/common/files/files.services';
import { LocationService } from 'src/modules/locations/location.service';
import { FilterRequestDto } from '../dto/filter-request.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { MediaDir } from '../../../common/files/media-dir-.enum';
import { ServicesService } from 'src/modules/services/services.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(ServiceRequestsEntity)
    private serviceRequestsRepository: Repository<ServiceRequestsEntity>,

    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly filesService: FilesService,
    private readonly locationService: LocationService,
    private readonly paginatorService: PaginatorService,
  ) {}

  async save(request){
    return await this.serviceRequestsRepository.save(request);
  }

  //User
  async createServiceRequest(createServiceRequestDto: CreateServiceRequestDto, userId: number, media: Express.Multer.File[], lang: LanguagesEnum){
    const user = await this.usersService.findById(userId);
    const service =  await this.servicesService.findOne(createServiceRequestDto.serviceId, lang);
    const requestNumber = `REQ-${uuidv4().split('-')[0]}`;
    
    const {images, location, serviceId, ...dtoWithoutImages} = createServiceRequestDto;
    let imagesPath = [];
    if (media && media.length > 0) {
      await Promise.all(
        media.map(async (file) => {
          const filePath = await this.filesService.saveFile(file, MediaDir.REQUESTS);
          imagesPath.push(filePath.path);
        })
      );
    }

    
    const serviceRequest = this.serviceRequestsRepository.create({
      ...dtoWithoutImages,
      requestNumber,
      user,
      service,
      media: imagesPath.map((image) => {
        return { media: image };
      }),
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
    await this.serviceRequestsRepository.save(serviceRequest);
    return this.findRequestById(serviceRequest.id, lang, userId);

  }

  async findAllServiceRequests(filter: FilterRequestDto,lang:LanguagesEnum, userId?: number, technicianId?: number, dashboard?:boolean){
    const page = filter.page || 1;
    const take = filter.limit || 10;

    const query = this.serviceRequestsRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.offers', 'offers')
      .leftJoinAndSelect('request.media', 'media')
      .where('request.deleted = false')
      .andWhere('user.deleted = false')
      .select([
        'request.id',
        'request.title',
        'request.description',
        'request.status',
        'request.requestNumber',
        'request.arAddress',
        'request.enAddress',
        'request.createdAt',

        'user.id',
        'user.username',

        'service.id',
        'service.arName',
        'service.enName',
        'service.icone',
        'offers.id',
        'media.id',
        'media.media'
      ]);
      
    if(!dashboard){
      query.andWhere('user.status = :status', { status: 'active' })
    }

    if (filter.serviceId) {
      query.andWhere('request.service_id = :serviceId', { serviceId: filter.serviceId });
    }

    if (filter.search) {
      query.andWhere(
        '(user.username ILIKE :search OR request.arAddress ILIKE :search OR request.enAddress ILIKE :search)',
        { search: `%${filter.search}%` }
      );
    }

    if (userId) {
      query.andWhere('request.user_id = :userId', { userId });
    }

    if (technicianId) {
      query.andWhere('request.technician_id = :technicianId', { technicianId });
    }

   if (filter.status) {
    query.andWhere('CAST(request.status AS text) = :status', { status: filter.status.toLowerCase() });
   }
    
  if(!dashboard && !userId && !technicianId ){
    query.andWhere('CAST(request.status AS text) = :status', { status: 'pending' });
  }
  
  query
    .orderBy('request.createdAt', 'DESC')
    .skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [result, total] = await query.getManyAndCount();


    let mappedResult;
    if(lang === LanguagesEnum.ARABIC){
      mappedResult = result.map(r => {
        const address = r.arAddress;
        const serviceName = r.service?.arName;
        return { ...r, address, service: {...r.service, name: serviceName}};
      });
    }
    else{
      mappedResult = result.map(r => {
        const address = r.enAddress;
        const serviceName = r.service?.enName;
        return { ...r, address, service: {...r.service, name: serviceName} };
      });
    }
    mappedResult.map((r)=>{
      delete r.arAddress;
      delete r.enAddress;
      delete (r.service as any).arName;
      delete (r.service as any).enName;
      return {...r, offersCount: r.offers.length }
    })

    return this.paginatorService.makePaginate(mappedResult || result, total, take, page);
  }

  async findRequestById(id: number, lang: LanguagesEnum, userId?: number, dashboard?:boolean){
    const addressField = lang === LanguagesEnum.ARABIC ? 'arAddress' : 'enAddress';
    const serviceNameField = lang === LanguagesEnum.ARABIC ? 'arName' : 'enName';

    // load entity with relations (avoid raw selects that cause alias/from issues)
    const requestEntity = await this.serviceRequestsRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.technician', 'technician')
      .leftJoinAndSelect('request.offers', 'offers')
      .leftJoinAndSelect('offers.technician', 'offerTechnician')
      .leftJoinAndSelect('request.media', 'media')
      .leftJoinAndSelect('request.service', 'service')
      .where('request.id = :id', { id })
      .andWhere('request.deleted = false')
      .andWhere('user.deleted = false')
      .andWhere('user.status = :status', { status: 'active' })
      .andWhere('(technician.id IS NULL OR (technician.deleted = false AND technician.status = :techStatus))', { techStatus: 'active' })
      .getOne();

    if (!requestEntity) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`هذا الطلب غير موجود`);
      }else{
        throw new NotFoundException(`Service not found`);
      }
    }

    // build DTO safely from the entity
    const offers = (requestEntity.offers || []).map(o => ({
      id: o.id,
      price: typeof o.price === 'number' ? o.price : Number(o.price),
      createdAt: o.createdAt,
      technician: o.technician ? { id: o.technician.id, username: o.technician.user.username, avgRating: (o.technician as any).avgRating } : null,
      needsDelivery: (o as any).needsDelivery,
      description: (o as any).description,
      
    }));

    const media = (requestEntity.media || []).map(m => ({
      id: m.id,
      media: m.media,
    }));

    const requestData = {
      id: requestEntity.id,
      title: requestEntity.title,
      description: requestEntity.description,
      address: (requestEntity as any)[addressField],
      status: requestEntity.status,
      price: typeof requestEntity.price === 'number' ? requestEntity.price : Number(requestEntity.price),
      requestNumber: requestEntity.requestNumber,
      offersCount: offers.length,
      user: { id: requestEntity.user.id },
      service: { id: requestEntity.service?.id ?? null, name: requestEntity.service ? (requestEntity.service as any)[serviceNameField] : null },
      technician: requestEntity.technician ? { id: requestEntity.technician.id } : null,
      media,
      offers,
    };

    // hide price/offers prices from non-owner callers when not dashboard
    if (!dashboard && userId && requestEntity.user.id !== userId) {
      requestData.price = null;
      requestData.offers = requestData.offers.map(o => ({ ...o, price: null }));
    }

    return requestData;
  }
  
  //user
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
    const request = await this.findRequestById(id, LanguagesEnum.ENGLISH);
    request.status = status;
    return this.serviceRequestsRepository.save(request);
  }
}