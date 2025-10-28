import { BadRequestException, Injectable, NotFoundException, Req } from '@nestjs/common';
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
import { join } from 'path';
import { CloudflareService } from 'src/common/files/cloudflare.service';
import { UpdateServiceRequestDto } from '../dto/update-service-request.dto';

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
    private readonly cloudflareService: CloudflareService,
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
          const uploadedFile = await this.cloudflareService.uploadFile(file);
          imagesPath.push(uploadedFile.url);
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
        'user.image',

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
      query.andWhere('CAST(request.status AS text) ILIKE :requestStatus', { requestStatus: filter.status });
    }
    
    if (!dashboard && !userId && !technicianId && !filter.status) {
      query.andWhere('CAST(request.status AS text) ILIKE :defaultStatus', { defaultStatus: 'pending' });
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
      // ensure the technician's user relation is loaded so .technician.user.username exists
      .leftJoinAndSelect('offerTechnician.user', 'offerTechnicianUser')
      .leftJoinAndSelect('request.media', 'media')
      .leftJoinAndSelect('request.service', 'service')
      .where('request.id = :id', { id })
      .andWhere('request.deleted = false')
      .andWhere('user.deleted = false')
      .andWhere('user.status = :status', { status: 'active' })
      // .andWhere('(technician.id IS NULL OR (technician.deleted = false AND technician.status = :techStatus))', { techStatus: 'active' })
      .getOne();
      
    if (!requestEntity) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`هذا الطلب غير موجود`);
      }else{
        throw new NotFoundException(`Request not found`);
      }
    }

    if(requestEntity.status === RequestStatus.COMPLETED && requestEntity.completedAt){
      const warrantyDays = requestEntity.remainingWarrantyDays;
      requestEntity.remainingWarrantyDays = this.calculateRemainingWarrantyDays(requestEntity.completedAt, warrantyDays);
      await this.serviceRequestsRepository.save(requestEntity);
    }
 
    // build DTO safely from the entity
    let offers = (requestEntity.offers || []).map(o => ({
      id: o.id,
      price: typeof o.price === 'number' ? o.price : Number(o.price),
      createdAt: o.createdAt,
      technician: o.technician ? {
        id: o.technician?.user?.id,
        username: o.technician?.user?.username ?? null,
        description: o.technician?.description ?? null,
        image: o.technician?.user?.image,
        avgRating: (o.technician as any)?.avgRating ?? null,
        address: lang === LanguagesEnum.ARABIC ? o.technician?.user?.arAddress : o.technician?.user?.enAddress
      } : null,
      needsDelivery: (o as any).needsDelivery,
      description: (o as any).description,
      accepted : (o as any).accepted,
    }));

    if(requestEntity.status === RequestStatus.COMPLETED || requestEntity.status === RequestStatus.IN_PROGRESS){
      offers = offers.filter(o => o.accepted === true);
    }

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
      user: { 
        id: requestEntity.user.id,
        username: requestEntity.user.username,
        image: requestEntity.user.image,
        address: lang === LanguagesEnum.ARABIC ? requestEntity.arAddress : requestEntity.enAddress
        },
      service: { id: requestEntity.service?.id ?? null, name: requestEntity.service ? (requestEntity.service as any)[serviceNameField] : null },
      technician: requestEntity.technician ? { id: requestEntity.technician.id } : null,
      media,
      offers,
      remainingWarrantyDays: requestEntity.remainingWarrantyDays,
      createdAt: requestEntity.createdAt,
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

  async findServiceRequestsByUserId(userId: number, lang?: LanguagesEnum): Promise<{requests: any[]}> {
    const requests = await this.serviceRequestsRepository.find({
      where: { user: { id: userId } },
      relations: ['service','user', 'technician', 'offers', 'offers.technician', 'media'],
      select:{
        id:true, 
        requestNumber:true,
        title:true,
        description:true,
        status:true,
        createdAt:true,
        service:{
          id:true,
          arName:true,
          enName:true,
          icone:true
        },
        user:{
          id:true,
          username:true,
          image:true,
          enAddress:true,
          arAddress:true
        },
        offers:{ id:true},
        media:{ id:true, media:true}
      }
    });

    return {
      requests: requests.map(r => {
        const address = lang === LanguagesEnum.ARABIC ? r.arAddress : r.enAddress;
        const serviceName = r.service ? (lang === LanguagesEnum.ARABIC ? r.service.arName : r.service.enName) : null;
        return {
          id: r.id,
          requestNumber: r.requestNumber,
          title: r.title,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt,
          service: r.service ? {
            id: r.service.id,
            name: serviceName,
            icone: r.service.icone? `${process.env.APP_URL}/${join(process.env.MEDIA_DIR, MediaDir.SERVICES, r.service.icone)}` : null
          } : null,
          user: {
            id: r.user.id,
            username: r.user.username,
            image: r.user.image,
            address: address
          },
          offersCount: r.offers.length,
          media: r.media
        };
      })
    };
  }

  async findServiceRequestsByTechnicianId(technicianId: number, lang?: LanguagesEnum) {
    let requests = await this.serviceRequestsRepository.find({
      where: { technician: { id: technicianId }, status : RequestStatus.COMPLETED },
      relations: ['user', 'technician', 'offers', 'offers.technician', 'media'],
      select:{
        id:true, 
        requestNumber:true,
        title:true,
        description:true,
        status:true,
        createdAt:true,
        service:{
          id:true,
          arName:true,
          enName:true,
          icone:true
        },
        user:{
          id:true,
          username:true,
          image:true,
          enAddress:true,
          arAddress:true
        },
        offers:{ id:true},
        media:{ id:true, media:true}
      }
    });
      return {
      requests: requests.map(r => {
        const address = lang === LanguagesEnum.ARABIC ? r.arAddress : r.enAddress;
        const serviceName = r.service ? (lang === LanguagesEnum.ARABIC ? r.service.arName : r.service.enName) : null;
        return {
          id: r.id,
          requestNumber: r.requestNumber,
          title: r.title,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt,
          service: r.service ? {
            id: r.service.id,
            name: serviceName,
            icone: r.service.icone? `${process.env.APP_URL}/${join(process.env.MEDIA_DIR, MediaDir.SERVICES, r.service.icone)}` : null
          } : null,
          user: {
            id: r.user.id,
            username: r.user.username,
            image: r.user.image,
            address: address
          },
          offersCount: r.offers.length,
          media: r.media
        };
      })
    };
  }

  async updateRequest(id: number, updateData: UpdateServiceRequestDto, images: Express.Multer.File[], lang: LanguagesEnum, userId?: number){
    const request = await this.serviceRequestsRepository.findOne({ where: { id, user: { id: userId ? userId : undefined } } });
    if(!request){
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? `طلب الخدمة غير موجود` : `Service request not found`
      );
    }
    
    let imagesPath = request.media ? request.media.map(m => m.media) : [];
    if (images && images.length > 0) {
      if(request.media && request.media.length > 0){
        // Delete existing images from Cloudflare
        // await Promise.all(
        //   request.media.map(async (media) => {
        //     const fileUrl = media.media;
        //     await this.cloudflareService.deleteFile(fileUrl);
        //   })
        // );
      }

      await Promise.all(
        images.map(async (file) => {
          const uploadedFile = await this.cloudflareService.uploadFile(file);
          imagesPath.push(uploadedFile.url);
        })
      );
    }
    Object.assign(request, {
      ...updateData,
      media: imagesPath.map((image) => {
        return { media: image };
      }),
    });
    return this.serviceRequestsRepository.save(request);

  }

  async requestCompleted(id: number, lang: LanguagesEnum): Promise<ServiceRequestsEntity> {
    const request = await this.serviceRequestsRepository.findOne({ where: { id } });
    request.status = RequestStatus.COMPLETED;
    request.completedAt = new Date();
    request.remainingWarrantyDays = 20;
    return this.serviceRequestsRepository.save(request);
  }

  async changeRequestStatus(id: number, status: RequestStatus, lang: LanguagesEnum, userId?: number): Promise<ServiceRequestsEntity> {
    const request = await this.serviceRequestsRepository.findOne({ where: { id, user: { id: userId ? userId : undefined } } });
    if(status == RequestStatus.CANCELLED && request.status === RequestStatus.COMPLETED){
      throw new BadRequestException(
        lang === LanguagesEnum.ARABIC ? `لا يمكن الغاء الطلب` : `Can't cancel the request.`
      )
    }

    if(!request){
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? `طلب الخدمة غير موجود` : `Service request not found`
      );
    }

    request.status = status;
    return this.serviceRequestsRepository.save(request);
  }
private calculateRemainingWarrantyDays(completedAt: Date, warrantyDays: number): number {
  const currentDate = new Date();
  const passedDays = Math.floor((currentDate.getTime() - completedAt.getTime()) / (1000 * 3600 * 24));
  const remainingDays = warrantyDays - passedDays;
  return remainingDays > 0 ? remainingDays : 0;
}

}