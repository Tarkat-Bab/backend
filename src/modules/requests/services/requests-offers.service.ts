import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { UsersService } from '../../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { RequestStatus } from '../enums/requestStatus.enum';
import { RequestsService } from './requests.service';

@Injectable()
export class RequestOffersService {
  constructor(
    @InjectRepository(RequestOffersEntity)
    private requestOffersRepository: Repository<RequestOffersEntity>,
  
    private requestService: RequestsService,
    private usersService: UsersService,
  ) {}

  async createRequestOffer(createRequestOfferDto: CreateRequestOfferDto, lang: LanguagesEnum): Promise<RequestOffersEntity> {
    const request = await this.requestService.findServiceRequestById(createRequestOfferDto.requestId, lang);
    const technician = await this.usersService.findById(createRequestOfferDto.technicianId, lang);

    if (!technician) {
      throw new NotFoundException(`Technical user with ID ${createRequestOfferDto.technicianId} not found`);
    }

    // Remove IDs from DTO as we're using the entities
    const { requestId, technicianId, ...offerData } = createRequestOfferDto;
    
    const offer = this.requestOffersRepository.create({
      ...offerData,
      request,
      technician,
    });

    return this.requestOffersRepository.save(offer);
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

  async findRequestOfferById(userId:number,id: number): Promise<RequestOffersEntity> {
    const offer = await this.requestOffersRepository.findOne({
      where: { id },
      relations: ['request', 'technician'],
    });

    if (!offer) {
      throw new NotFoundException(`Request offer with ID ${id} not found`);
    }

    return offer;
  }

  async updateRequestOffer(userId:number, id: number, updateRequestOfferDto: UpdateRequestOfferDto): Promise<RequestOffersEntity> {
    const offer = await this.findRequestOfferById(userId, id);
    Object.assign(offer, updateRequestOfferDto);
    return this.requestOffersRepository.save(offer);
  }

  async removeRequestOffer(id: number): Promise<void> {
    const result = await this.requestOffersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Request offer with ID ${id} not found`);
    }
  }

  async acceptOffer(userId: number, offerId: number) {
    const offer = await this.findRequestOfferById(userId, offerId);
    const request = offer.request;
    
    request.technician = offer.technician;
    request.price = offer.price;
    request.status = RequestStatus.IN_PROGRESS;
    
    // return this.requestService.save(request);
  }
}
