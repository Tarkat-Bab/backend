import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { UsersService } from '../../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { RequestStatus } from '../enums/requestStatus.enum';
import { RequestsService } from './requests.service';
import { LocationService } from 'src/modules/locations/location.service';
import { UsersTypes } from 'src/common/enums/users.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class RequestOffersService {
  constructor(
    @InjectRepository(RequestOffersEntity)
    private requestOffersRepository: Repository<RequestOffersEntity>,
  
    private requestService: RequestsService,
    private usersService: UsersService,
    private readonly locationService: LocationService,
    private readonly notificationService: NotificationsService
  ) {}

  async save(offer: RequestOffersEntity){
    return await this.requestOffersRepository.save(offer);
  }
  async createRequestOffer(technicianId: number, requestId: number, createRequestOfferDto: CreateRequestOfferDto, lang: LanguagesEnum): Promise<RequestOffersEntity> {
    const request = await this.requestService.findRequestById(requestId, lang);
    const user = await this.usersService.findById(technicianId, lang);

    if(user.type === UsersTypes.TECHNICAL && !user.technicalProfile.approved){
      throw new UnauthorizedException(
          lang === LanguagesEnum.ARABIC 
              ? 'لا يمكنك تقديم عرض قبل موافقة الادمن على حسابك' 
            : 'You cannot submit an offer before admin approves your account'
        );
    }

    if(request.status !== RequestStatus.PENDING){
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`لا يمكن تقديم عرض على طلب غير في حالة انتظار`);
      }else{
        throw new NotFoundException(`Cannot make an offer on a request that is not in pending status`);
      }
    }
    const { location, ...rest } = createRequestOfferDto;
    const dataToUpdate: any = { ...rest };


    if (location) {
      let parsedLocation = location as any;
      if (typeof location === 'string') {
        try {
        parsedLocation = JSON.parse(location);
      } catch {
        if(lang === LanguagesEnum.ARABIC){
          throw new BadRequestException('تنسيق الموقع غير صالح');
        }
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

      dataToUpdate.latitude  = saveLocation.latitude;
      dataToUpdate.longitude = saveLocation.longitude;
      dataToUpdate.arAddress = saveLocation.ar_address;
      dataToUpdate.enAddress = saveLocation.en_address;
    }
    
    if(user.type !== UsersTypes.TECHNICAL){
      if(lang === LanguagesEnum.ARABIC){
        throw new UnauthorizedException('المستخدم ليس فني');
      }
      throw new UnauthorizedException('User is not a technician');
    }

    // Get the technical profile using the techId from user
    const technicalProfile = await this.usersService.findTechnicianById(user.technicalProfile?.id, lang);
    if (!technicalProfile) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC
          ? 'الملف الفني غير موجود'
          : 'Technical profile not found'
      );
    }

    const offer = this.requestOffersRepository.create({
      latitude: dataToUpdate.latitude,
      longitude: dataToUpdate.longitude,
      arAddress: dataToUpdate.arAddress,
      enAddress: dataToUpdate.enAddress,
      price: createRequestOfferDto.price,
      needsDelivery: createRequestOfferDto.needsDelivery,
      description: createRequestOfferDto.description,
      request,
      technician: technicalProfile, // Use the technical profile entity
    });

    await this.requestOffersRepository.save(offer);
    
    await this.notificationService.autoNotification(request.user.id, 'RECEIVED_OFFER', { id: request.id});

    return this.findRequestOfferById(user.id, offer.id, lang, true);
  }

  async findAllRequestOffers(): Promise<RequestOffersEntity[]> {
    return this.requestOffersRepository.find({
      relations: ['request', 'technician'],
    });
  }

  async findRequestOffersByRequestId(requestId: number): Promise<RequestOffersEntity[]> {
    return this.requestOffersRepository.find({
      where: { request: { id: requestId } },
      relations: ['technician'],
    });
  }

  async findRequestOfferById(userId:number,id: number, lang: LanguagesEnum, dashboard?:boolean): Promise<RequestOffersEntity> {
    const offer = await this.requestOffersRepository.findOne({
      where: { id },
      relations: ['request', 'technician', 'request.user', 'technician.user'],
      select: {
        id: true,
        price: true,
        needsDelivery: true,
        description: true,
        accepted: true,
        technician: {
          id: true,
          user:{
            id: true,
            username: true,
          },
          avgRating: true,
       },
        request: {
          id: true,
          user: {
            id: true,
          },
        },
    }
    });

    if (!offer) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException('العرض غير موجود');
      }
      throw new NotFoundException(`Offer not found`);
    }

    if(!dashboard && offer.technician.id !== userId || offer.request.id !== userId ){
      offer.price = null;
    }

    return offer;
  }

  async removeOffer(offerId: number, lang: LanguagesEnum) {
    const offer = await this.requestOffersRepository.findOne({where:{id:offerId}});
    if (!offer) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException('العرض غير موجود');
      }
      throw new NotFoundException(`Offer not found`);
    }
    await this.requestOffersRepository.remove(offer);
  }

  async updateRequestOffer(userId:number, id: number, updateRequestOfferDto: UpdateRequestOfferDto, lang: LanguagesEnum): Promise<RequestOffersEntity> {
    const offer = await this.findRequestOfferById(userId, id, lang);
    Object.assign(offer, updateRequestOfferDto);
    return this.requestOffersRepository.save(offer);
  }

  async removeRequestOffer(id: number): Promise<void> {
    const result = await this.requestOffersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Request offer with ID ${id} not found`);
    }
  }

  async acceptOffer(userId: number, offerId: number, lang?: LanguagesEnum) {
    const offer = await this.requestOffersRepository.findOne({
      where: { id: offerId },
      relations: ['request', 'request.user', 'technician', 'technician.user'],
    });
    if(!offer){
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`العرض غير موجود`);
      }else{
        throw new NotFoundException(`Offer not found`);
      }
    }

    if(userId !== offer.request.user.id){
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`لا يمكنك قبول عرض ليس لطلبك`);
      }else{
        throw new NotFoundException(`You cannot accept an offer that is not for your request`);
      }
    }

    const request = await this.requestService.getRequest(offer.request.id, lang);
    const tech    = await this.usersService.findById(offer.technician.user.id, lang);

    request.technician = tech;
    request.status = RequestStatus.IN_PROGRESS;
    offer.accepted = true;
    
    await this.requestOffersRepository.save(offer);
    await this.notificationService.autoNotification(request.user.id, 'ACCEPTED_OFFER', {id: request.id});
    return this.requestService.save(request);
  }

  async findOne(offerId:number, lang: LanguagesEnum){
    const offer = await this.requestOffersRepository.findOne({
      where:{id: offerId},
      relations:{request: true}
    })
    
    if(!offer){
        throw new NotFoundException(
          lang === LanguagesEnum.ARABIC ?
           `هذا العرض غير موجود` : 'This offer not found.'
        )   
    }
    return offer;
  }
}
