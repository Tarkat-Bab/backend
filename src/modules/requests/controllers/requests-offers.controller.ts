import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { RequestOffersService } from '../services/requests-offers.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('request-offers')
@Controller('request-offers')
export class RequestOffersController {
  constructor(private readonly requestsOffersService: RequestOffersService) {}

  // @Post('offers')
  // @ApiHeader({
  //   name: 'accept-language',
  //   description: 'Language preference for the response',
  //   required: false,
  // })
  // @ApiOperation({ summary: 'Create a new request offer' })
  // @ApiResponse({ status: 201, description: 'The offer has been created successfully.', type: RequestOffersEntity })
  // @ApiBody({ type: CreateRequestOfferDto })
  // @ApiBearerAuth()
  // async createRequestOffer(
  //   @Query('lang') lang: LanguagesEnum,
  //   @Body() createRequestOfferDto: CreateRequestOfferDto,
  // ): Promise<RequestOffersEntity> {
  //   return this.requestsOffersService.createRequestOffer(createRequestOfferDto, lang);
  // }

  // @Get('offers')
  // @ApiOperation({ summary: 'Get all request offers' })
  // @ApiResponse({ status: 200, description: 'Return all request offers.', type: [RequestOffersEntity] })
  // @ApiBearerAuth()
  // async findAllRequestOffers(): Promise<RequestOffersEntity[]> {
  //   return this.requestsOffersService.findAllRequestOffers();
  // }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get a request offer by id' })
  @ApiParam({ name: 'id', description: 'Request Offer ID' })
  @ApiResponse({ status: 200, description: 'Return the request offer.', type: RequestOffersEntity })
  @ApiResponse({ status: 404, description: 'Request offer not found.' })
  @ApiBearerAuth()
  async findRequestOfferById(
    @CurrentUser() user: any,
    @Param('id') id: number
  ): Promise<RequestOffersEntity> {
    return this.requestsOffersService.findRequestOfferById(user.id, id);
  }

  @Get('/:requestId/offers')
  @ApiOperation({ summary: 'Get all offers for a service request' })
  @ApiParam({ name: 'requestId', description: 'Service Request ID' })
  @ApiResponse({ status: 200, description: 'Return all offers for the request.', type: [RequestOffersEntity] })
  async findRequestOffersByRequestId(@Param('requestId') requestId: number): Promise<RequestOffersEntity[]> {
    return this.requestsOffersService.findRequestOffersByRequestId(requestId);
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
  ): Promise<RequestOffersEntity> {
    return this.requestsOffersService.updateRequestOffer(user.id,id,  updateRequestOfferDto);
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

  // @Post('offers/:id/accept')
  // @ApiOperation({ summary: 'Accept an offer for a service request' })
  // @ApiParam({ name: 'id', description: 'Request Offer ID' })
  // @ApiResponse({ status: 200, description: 'The offer has been accepted.', type: ServiceRequestsEntity })
  // @ApiResponse({ status: 404, description: 'Request offer not found.' })
  // @ApiBearerAuth()
  // async acceptOffer(@Param('id') id: string): Promise<ServiceRequestsEntity> {
  //   return this.requestsOffersService.acceptOffer(id);
  // }
}
