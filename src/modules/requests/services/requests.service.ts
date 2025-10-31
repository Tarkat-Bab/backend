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
import { join } from 'path';
import { CloudflareService } from 'src/common/files/cloudflare.service';
import { UpdateServiceRequestDto } from '../dto/update-service-request.dto';
import { RequestsMedia } from '../entities/request_media.entity';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(ServiceRequestsEntity)
    private serviceRequestsRepository: Repository<ServiceRequestsEntity>,
    @InjectRepository(RequestsMedia)
    private mediaRepository: Repository<RequestsMedia>,
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

  async findRequestById(
    id: number,
    lang: LanguagesEnum,
    userId?: number,
    dashboard?: boolean
  ) {
    const addressField = lang === LanguagesEnum.ARABIC ? 'arAddress' : 'enAddress';
    const serviceNameField = lang === LanguagesEnum.ARABIC ? 'arName' : 'enName';

    const requestEntity = await this.serviceRequestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.technician', 'technician')
      .leftJoinAndSelect('technician.technicalProfile', 'technicalProfile')
      .leftJoinAndSelect('technicalProfile.reviews', 'techReviews')

      .leftJoinAndSelect('request.offers', 'offers')
      .leftJoinAndSelect('offers.technician', 'offerTechnician')
      .leftJoinAndSelect('offerTechnician.services', 'techService')
      .leftJoinAndSelect('offerTechnician.user', 'offerTechnicianUser')
      .leftJoinAndSelect('offerTechnician.reviews', 'offerTechReviews') 
      .leftJoinAndSelect('request.media', 'media')
      .leftJoinAndSelect('request.service', 'service')
      .where('request.id = :id', { id })
      .andWhere('request.deleted = false')
      .andWhere('user.deleted = false')
      .andWhere('user.status = :status', { status: 'active' })
      .getOne();

    if (!requestEntity) {
      if (lang === LanguagesEnum.ARABIC) {
        throw new NotFoundException(`هذا الطلب غير موجود`);
      } else {
        throw new NotFoundException(`Request not found`);
      }
    }

    if (
      requestEntity.status === RequestStatus.COMPLETED &&
      requestEntity.completedAt
    ) {
      requestEntity.remainingWarrantyDays = this.calculateRemainingWarrantyDays(
        requestEntity.completedAt,
        requestEntity.remainingWarrantyDays
      );
    }
      
    let offers = (requestEntity.offers || []).map((o) => {
      const reviews = o.technician?.reviews || [];
      return {
        id: o.id,
        price: typeof o.price === 'number' ? o.price : Number(o.price),
        createdAt: o.createdAt,
        technician: o.technician
          ? {
              id: o.technician?.user?.id,
              username: o.technician?.user?.username ?? null,
              image: o.technician?.user?.image ?? null,
              avgRating: o.technician?.avgRating ?? 0,
              totalReviews: o.technician?.reviews?.length ?? 0,
              address:
                lang === LanguagesEnum.ARABIC
                  ? o.technician?.user?.arAddress
                  : o.technician?.user?.enAddress,
            }
          : null,
        needsDelivery: (o as any).needsDelivery,
        description: (o as any).description,
        accepted: (o as any).accepted,
      };
    });

    if (
      requestEntity.status === RequestStatus.COMPLETED ||
      requestEntity.status === RequestStatus.IN_PROGRESS
    ) {
      offers = offers.filter((o) => o.accepted === true);
    }

    const media = (requestEntity.media || []).map((m) => ({
      id: m.id,
      media: m.media,
    }));

    let requestData = {
      id: requestEntity.id,
      title: requestEntity.title,
      description: requestEntity.description,
      address: (requestEntity as any)[addressField],
      status: requestEntity.status,
      price:
        typeof requestEntity.price === 'number'
          ? requestEntity.price
          : Number(requestEntity.price),
      requestNumber: requestEntity.requestNumber,
      offersCount: offers.length,
      user: {
        id: requestEntity.user.id,
        username: requestEntity.user.username,
        image: requestEntity.user.image,
        address:
          lang === LanguagesEnum.ARABIC
            ? requestEntity.arAddress
            : requestEntity.enAddress,
      },
      service: requestEntity.service
        ? {
            id: requestEntity.service.id,
            name: (requestEntity.service as any)[serviceNameField],
          }
        : null,
        technician: requestEntity.technician
          ? {
              id: requestEntity.technician.id,
              username: requestEntity.technician?.username ?? null,
              image: requestEntity.technician?.image ?? null,
              avgRating: requestEntity.technician.technicalProfile.avgRating,
              totalReviews: requestEntity.technician?.technicalProfile?.reviews?.length ?? 0,
              address:
                lang === LanguagesEnum.ARABIC
                  ? requestEntity.technician?.arAddress
                  : requestEntity.technician?.enAddress,
            }
          : null,
      media,
      offers,
      remainingWarrantyDays: requestEntity.remainingWarrantyDays,
      createdAt: requestEntity.createdAt,
    };

    if (!dashboard && userId && requestEntity.user.id !== userId) {
      requestData = {
        ...requestData,
        price: null,
        offers: requestData.offers.map((o) => ({ ...o, price: null })),
      };
    }

    return requestData;
  }

  async removeServiceRequest(id: number): Promise<void> {
    const result = await this.serviceRequestsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }
  }

  async findServiceRequestsByUserId(userId: number, filterUser: PaginatorInput, lang?: LanguagesEnum) {
    const page = filterUser.page || 1;
    const limit = filterUser.limit || 10;
    const offset = (page - 1) * limit;

    const addressField =
      lang === LanguagesEnum.ARABIC ? 'user.arAddress' : 'user.enAddress';
    const serviceNameField =
      lang === LanguagesEnum.ARABIC ? 'service.arName' : 'service.enName';

    const query = this.serviceRequestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.media', 'media')
      .leftJoin('request.offers', 'offers')
      .where('user.id = :userId', { userId })
      .andWhere('request.deleted = false')
      .select([
        'request.id AS id',
        'request.requestNumber AS requestNumber',
        'request.title AS title',
        'request.description AS description',
        'request.status AS status',
        'request.createdAt AS createdAt',

        'service.id AS serviceId',
        `${serviceNameField} AS serviceName`,
        'service.icone AS serviceIcone',

        'user.id AS userId',
        'user.username AS username',
        'user.image AS userImage',
        `${addressField} AS userAddress`,

        'COUNT(DISTINCT offers.id) AS offersCount',
      ])
      .groupBy('request.id')
      .addGroupBy('service.id')
      .addGroupBy('user.id')
      .addGroupBy('service.icone')
      .addGroupBy(`${serviceNameField}`)
      .addGroupBy(`${addressField}`)
      .orderBy('request.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [rawResult, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);

    const mappedResult = rawResult.map((r) => ({
      id: r.id,
      requestNumber: r.requestnumber,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdat,
      service: r.serviceid
        ? {
            id: r.serviceid,
            name: r.servicename,
            icone: r.serviceicone ?? null,
          }
        : null,
      user: {
        id: r.userid,
        username: r.username,
        image: r.userimage,
        address: r.useraddress,
      },
      offersCount: Number(r.offerscount ?? 0),
    }));

    return this.paginatorService.makePaginate(mappedResult, total, limit, page);
  }


  async findServiceRequestsByTechnicianId( id: number, filterTechnician: PaginatorInput, lang?: LanguagesEnum) {
    const page = filterTechnician.page || 1;
    const limit = filterTechnician.limit || 10;

    const offset = (page - 1) * limit;
    const addressField =
      lang === LanguagesEnum.ARABIC ? 'user.arAddress' : 'user.enAddress';
    const serviceNameField =
      lang === LanguagesEnum.ARABIC ? 'service.arName' : 'service.enName';

    const query = this.serviceRequestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.technician', 'technician')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.media', 'media')
      .leftJoinAndSelect('request.offers', 'offers')
       .where('technician.id = :id', { id })
      .andWhere('request.deleted = false')
      .orderBy('request.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .select([
        'request.id AS id',
        'request.requestNumber AS requestNumber',
        'request.title AS title',
        'request.description AS description',
        'request.status AS status',
        'request.createdAt AS createdAt',
        'service.id AS serviceId',
        `${serviceNameField} AS serviceName`,
        'service.icone AS serviceIcone',
        'user.id AS userId',
        'user.username AS username',
        'user.image AS userImage',
        `${addressField} AS userAddress`,
        'COUNT(DISTINCT offers.id) AS offersCount',
      ])
      .groupBy('request.id')
      .addGroupBy('service.id')
      .addGroupBy('user.id')
      .addGroupBy('media.id')
      .addGroupBy('service.icone')
      .addGroupBy(`${serviceNameField}`)
      .addGroupBy(`${addressField}`);

    const [rawResult, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);

    const mappedResult = rawResult.map((r) => ({
      id: r.id,
      requestNumber: r.requestnumber,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdat,
      service: r.serviceid
        ? {
            id: r.serviceid,
            name: r.servicename,
            icone: r.serviceicone
          }
        : null,
      user: {
        id: r.userid,
        username: r.username,
        image: r.userimage,
        address: r.useraddress,
      },
      offersCount: Number(r.offerscount ?? 0),
      media: r.media ? r.media.map((m) => ({ id: m.id, media: m.media })) : [],
    }));

    return this.paginatorService.makePaginate(mappedResult, total, limit, page);
  }

  async updateRequest(id: number, updateData: UpdateServiceRequestDto, images: Express.Multer.File[], lang: LanguagesEnum, userId?: number){
    const {location, ...rest} = updateData;
    const request = await this.serviceRequestsRepository.findOne({ where: { id,  } });
    if(!request){
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? `طلب الخدمة غير موجود` : `Service request not found`
      );
    }
    
    let imagesPath = request.media ? request.media.map(m => m.media) : [];
    if (images && images.length > 0) {
      await this.mediaRepository.remove(request.media);
      // Delete existing images from Cloudflare
      if(request.media && request.media.length > 0){
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

      request.latitude  = saveLocation.latitude;
      request.longitude = saveLocation.longitude;
      request.arAddress = saveLocation.ar_address;
      request.enAddress = saveLocation.en_address;
    }

    Object.assign(request, {
      ...rest,
      media: imagesPath.map((image) => {
        return { media: image };
      }),
    });
    return this.serviceRequestsRepository.save(request);

  }

  async changeRequestStatus(id: number, status: RequestStatus, lang: LanguagesEnum, userId?: number): Promise<ServiceRequestsEntity> {
    const request = await this.serviceRequestsRepository.findOne({ where: { id, user: { id: userId ? userId : undefined } } });
    if(!request){
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? `طلب الخدمة غير موجود` : `Service request not found`
      );
    }

    request.status = status;
    return this.serviceRequestsRepository.save(request);
  }

  async reviewedRequest(id: number, lang?: LanguagesEnum): Promise<void> {
    const request = await this.serviceRequestsRepository.findOne({ where: { id } });  
    if(request.reviewed){
      throw new BadRequestException(lang === LanguagesEnum.ARABIC ? 'تمت تقيم الطلب مسبقًا' : 'The request has already been reviewed');
    }
    request.reviewed = true;
    await this.serviceRequestsRepository.save(request);
  }

private calculateRemainingWarrantyDays(completedAt: Date, warrantyDays: number): number {
  const currentDate = new Date();
  const passedDays = Math.floor((currentDate.getTime() - completedAt.getTime()) / (1000 * 3600 * 24));
  const remainingDays = warrantyDays - passedDays;
  return remainingDays > 0 ? remainingDays : 0;
}

}
