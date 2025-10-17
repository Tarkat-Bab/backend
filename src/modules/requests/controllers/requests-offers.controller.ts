import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { RequestOffersService } from '../services/requests-offers.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';

@ApiBearerAuth()
@ApiTags('request-offers')
@Controller('request-offers')
export class RequestOffersController {
  constructor(private readonly requestsOffersService: RequestOffersService) {}

  @Post('offers/:requestId')
  @ApiHeader({
    name: 'accept-language',
    description: 'Language preference for the response',
    required: false,
  })
  @ApiOperation({ summary: 'Create a new request offer (Technician API)' })
  @ApiBearerAuth()
  async createRequestOffer(
    @CurrentUser() user: any,
    @Param('requestId') requestId: number,
    @Language() lang: LanguagesEnum,
    @Body() createRequestOfferDto: CreateRequestOfferDto,
  ): Promise<RequestOffersEntity> {
    return this.requestsOffersService.createRequestOffer(user.id, requestId, createRequestOfferDto, lang);
  }

  // @Get('offers')
  // @ApiOperation({ summary: 'Get all request offers' })
  // @ApiResponse({ status: 200, description: 'Return all request offers.', type: [RequestOffersEntity] })
  // @ApiBearerAuth()
  // async findAllRequestOffers(): Promise<RequestOffersEntity[]> {
  //   return this.requestsOffersService.findAllRequestOffers();
  // }

  @Get('offers/:id')
  @ApiHeader({
    name: 'accept-language',
    description: 'Language preference for the response',
    required: false,
  })
  @ApiOperation({ summary: 'Get a request offer by id (Technician API, Client API)' })
  @ApiParam({ name: 'id', description: 'Request Offer ID' })
  @ApiBearerAuth()
  async findRequestOfferById(
    @Language() lang: LanguagesEnum,
    @CurrentUser() user: any,
    @Param('id') id: number
  ): Promise<RequestOffersEntity> {
    return this.requestsOffersService.findRequestOfferById(user.id, id, lang);
  }


  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update a request offer' })
  @ApiParam({ name: 'id', description: 'Request Offer ID' })
  @ApiBody({ type: UpdateRequestOfferDto })
  @ApiResponse({ status: 200, description: 'Return the updated request offer.', type: RequestOffersEntity })
  @ApiResponse({ status: 404, description: 'Request offer not found.' })
  @ApiBearerAuth()
  async updateRequestOffer(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Body() updateRequestOfferDto: UpdateRequestOfferDto,
    @Language() lang: LanguagesEnum,
  ): Promise<RequestOffersEntity> {
    return this.requestsOffersService.updateRequestOffer(user.id,id,  updateRequestOfferDto, lang);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Delete a request offer' })
  @ApiParam({ name: 'id', description: 'Request Offer ID' })
  @ApiResponse({ status: 200, description: 'The request offer has been deleted.' })
  @ApiResponse({ status: 404, description: 'Request offer not found.' })
  @ApiBearerAuth()
  async removeRequestOffer(@Param('id') id: number): Promise<void> {
    return this.requestsOffersService.removeRequestOffer(id);
  }

  @Post('offers/accept/:id')
  @ApiOperation({ summary: 'Accept an offer for a  request' })
  @ApiParam({ name: 'id', description: 'Request Offer ID' })
  @ApiResponse({ status: 200, description: 'The offer has been accepted.', type: ServiceRequestsEntity })
  @ApiBearerAuth()
  async acceptOffer(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Language() lang: LanguagesEnum,
  ){
    return this.requestsOffersService.acceptOffer(user.id, id, lang);
  }
}
