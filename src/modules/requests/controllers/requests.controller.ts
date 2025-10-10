import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RequestsService } from '../services/requests.service';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { UpdateServiceRequestDto } from '../dto/update-service-request.dto';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { RequestStatus } from '../enums/requestStatus.enum';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // // Service Requests Endpoints
  // @Post()
  // @ApiOperation({ summary: 'Create a new service request' })
  // @ApiResponse({ status: 201, description: 'The service request has been created successfully.', type: ServiceRequestsEntity })
  // @ApiBody({ type: CreateServiceRequestDto })
  // @ApiBearerAuth()
  // async createServiceRequest(@Body() createServiceRequestDto: CreateServiceRequestDto): Promise<ServiceRequestsEntity> {
  //   return this.requestsService.createServiceRequest(createServiceRequestDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all service requests' })
  // @ApiResponse({ status: 200, description: 'Return all service requests.', type: [ServiceRequestsEntity] })
  // @ApiBearerAuth()
  // async findAllServiceRequests(): Promise<ServiceRequestsEntity[]> {
  //   return this.requestsService.findAllServiceRequests();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get a service request by id' })
  // @ApiParam({ name: 'id', description: 'Service Request ID' })
  // @ApiResponse({ status: 200, description: 'Return the service request.', type: ServiceRequestsEntity })
  // @ApiResponse({ status: 404, description: 'Service request not found.' })
  // @ApiBearerAuth()
  // async findServiceRequestById(@Param('id') id: string): Promise<ServiceRequestsEntity> {
  //   return this.requestsService.findServiceRequestById(id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a service request' })
  // @ApiParam({ name: 'id', description: 'Service Request ID' })
  // @ApiBody({ type: UpdateServiceRequestDto })
  // @ApiResponse({ status: 200, description: 'Return the updated service request.', type: ServiceRequestsEntity })
  // @ApiResponse({ status: 404, description: 'Service request not found.' })
  // @ApiBearerAuth()
  // async updateServiceRequest(
  //   @Param('id') id: string,
  //   @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  // ): Promise<ServiceRequestsEntity> {
  //   return this.requestsService.updateServiceRequest(id, updateServiceRequestDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a service request' })
  // @ApiParam({ name: 'id', description: 'Service Request ID' })
  // @ApiResponse({ status: 200, description: 'The service request has been deleted.' })
  // @ApiResponse({ status: 404, description: 'Service request not found.' })
  // @ApiBearerAuth()
  // async removeServiceRequest(@Param('id') id: string): Promise<void> {
  //   return this.requestsService.removeServiceRequest(id);
  // }

  // @Get('user/:userId')
  // @ApiOperation({ summary: 'Get all service requests by user id' })
  // @ApiParam({ name: 'userId', description: 'User ID' })
  // @ApiResponse({ status: 200, description: 'Return all service requests for the user.', type: [ServiceRequestsEntity] })
  // @ApiBearerAuth()
  // async findServiceRequestsByUserId(@Param('userId') userId: string): Promise<ServiceRequestsEntity[]> {
  //   return this.requestsService.findServiceRequestsByUserId(userId);
  // }

  // @Get('technician/:technicianId')
  // @ApiOperation({ summary: 'Get all service requests by technician id' })
  // @ApiParam({ name: 'technicianId', description: 'Technician ID' })
  // @ApiResponse({ status: 200, description: 'Return all service requests for the technician.', type: [ServiceRequestsEntity] })
  // @ApiBearerAuth()
  // async findServiceRequestsByTechnicianId(@Param('technicianId') technicianId: string): Promise<ServiceRequestsEntity[]> {
  //   return this.requestsService.findServiceRequestsByTechnicianId(technicianId);
  // }

  // @Patch(':id/status')
  // @ApiOperation({ summary: 'Change status of a service request' })
  // @ApiParam({ name: 'id', description: 'Service Request ID' })
  // @ApiBody({ schema: { properties: { status: { type: 'string', enum: Object.values(RequestStatus) } } } })
  // @ApiResponse({ status: 200, description: 'Return the updated service request.', type: ServiceRequestsEntity })
  // @ApiBearerAuth()
  // async changeRequestStatus(
  //   @Param('id') id: string,
  //   @Body('status') status: RequestStatus,
  // ): Promise<ServiceRequestsEntity> {
  //   return this.requestsService.changeRequestStatus(id, status);
  // }

  // // Request Offers Endpoints
  // @Post('offers')
  // @ApiOperation({ summary: 'Create a new request offer' })
  // @ApiResponse({ status: 201, description: 'The offer has been created successfully.', type: RequestOffersEntity })
  // @ApiBody({ type: CreateRequestOfferDto })
  // @ApiBearerAuth()
  // async createRequestOffer(@Body() createRequestOfferDto: CreateRequestOfferDto): Promise<RequestOffersEntity> {
  //   return this.requestsService.createRequestOffer(createRequestOfferDto);
  // }

  // @Get('offers')
  // @ApiOperation({ summary: 'Get all request offers' })
  // @ApiResponse({ status: 200, description: 'Return all request offers.', type: [RequestOffersEntity] })
  // @ApiBearerAuth()
  // async findAllRequestOffers(): Promise<RequestOffersEntity[]> {
  //   return this.requestsService.findAllRequestOffers();
  // }

  // @Get('offers/:id')
  // @ApiOperation({ summary: 'Get a request offer by id' })
  // @ApiParam({ name: 'id', description: 'Request Offer ID' })
  // @ApiResponse({ status: 200, description: 'Return the request offer.', type: RequestOffersEntity })
  // @ApiResponse({ status: 404, description: 'Request offer not found.' })
  // @ApiBearerAuth()
  // async findRequestOfferById(@Param('id') id: string): Promise<RequestOffersEntity> {
  //   return this.requestsService.findRequestOfferById(id);
  // }

  // @Get('/:requestId/offers')
  // @ApiOperation({ summary: 'Get all offers for a service request' })
  // @ApiParam({ name: 'requestId', description: 'Service Request ID' })
  // @ApiResponse({ status: 200, description: 'Return all offers for the request.', type: [RequestOffersEntity] })
  // @ApiBearerAuth()
  // async findRequestOffersByRequestId(@Param('requestId') requestId: string): Promise<RequestOffersEntity[]> {
  //   return this.requestsService.findRequestOffersByRequestId(requestId);
  // }

  // @Patch('offers/:id')
  // @ApiOperation({ summary: 'Update a request offer' })
  // @ApiParam({ name: 'id', description: 'Request Offer ID' })
  // @ApiBody({ type: UpdateRequestOfferDto })
  // @ApiResponse({ status: 200, description: 'Return the updated request offer.', type: RequestOffersEntity })
  // @ApiResponse({ status: 404, description: 'Request offer not found.' })
  // @ApiBearerAuth()
  // async updateRequestOffer(
  //   @Param('id') id: string,
  //   @Body() updateRequestOfferDto: UpdateRequestOfferDto,
  // ): Promise<RequestOffersEntity> {
  //   return this.requestsService.updateRequestOffer(id, updateRequestOfferDto);
  // }

  // @Delete('offers/:id')
  // @ApiOperation({ summary: 'Delete a request offer' })
  // @ApiParam({ name: 'id', description: 'Request Offer ID' })
  // @ApiResponse({ status: 200, description: 'The request offer has been deleted.' })
  // @ApiResponse({ status: 404, description: 'Request offer not found.' })
  // @ApiBearerAuth()
  // async removeRequestOffer(@Param('id') id: string): Promise<void> {
  //   return this.requestsService.removeRequestOffer(id);
  // }

  // @Post('offers/:id/accept')
  // @ApiOperation({ summary: 'Accept an offer for a service request' })
  // @ApiParam({ name: 'id', description: 'Request Offer ID' })
  // @ApiResponse({ status: 200, description: 'The offer has been accepted.', type: ServiceRequestsEntity })
  // @ApiResponse({ status: 404, description: 'Request offer not found.' })
  // @ApiBearerAuth()
  // async acceptOffer(@Param('id') id: string): Promise<ServiceRequestsEntity> {
  //   return this.requestsService.acceptOffer(id);
  // }
}
