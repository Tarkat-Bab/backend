import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { RequestsService } from '../services/requests.service';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { UpdateServiceRequestDto } from '../dto/update-service-request.dto';
import { CreateRequestOfferDto } from '../dto/create-request-offer.dto';
import { UpdateRequestOfferDto } from '../dto/update-request-offer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { RequestOffersEntity } from '../entities/request_offers.entity';
import { RequestStatus } from '../enums/requestStatus.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { isPublic } from 'src/common/decorators/public.decorator';
@ApiBearerAuth()
@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // Service Requests Endpoints
  @Post('client')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference',
    required: false,
    schema: { enum: Object.values(LanguagesEnum), default: LanguagesEnum.ENGLISH },
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new request (Client Api)' })
  @ApiBody({ type: CreateServiceRequestDto })
  @UseInterceptors(FilesInterceptor('images'))
  async createServiceRequest(
    @CurrentUser() user: any,
    @Body() createServiceRequestDto: CreateServiceRequestDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Language() lang: LanguagesEnum,
  ): Promise<ServiceRequestsEntity> {
    return this.requestsService.createServiceRequest(createServiceRequestDto, user.id, images, lang);
  }

  @Get('client/:id')
  @ApiOperation({ summary: 'Get a request by id' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiResponse({ status: 200, description: 'Return the service request.', type: ServiceRequestsEntity })
  @ApiResponse({ status: 404, description: 'Service request not found.' })
  @ApiBearerAuth()
  async findServiceRequestById(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Language() lang: LanguagesEnum,
  ): Promise<ServiceRequestsEntity> {
    return this.requestsService.findServiceRequestById(id, lang, user.id);
  }

  @Patch('client/:id')
  @ApiOperation({ summary: 'Update a service request' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiBody({ type: UpdateServiceRequestDto })
  @ApiResponse({ status: 200, description: 'Return the updated service request.', type: ServiceRequestsEntity })
  @ApiResponse({ status: 404, description: 'Service request not found.' })
  async updateServiceRequest(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ): Promise<ServiceRequestsEntity> {
    return this.requestsService.updateServiceRequest(id, updateServiceRequestDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service request' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiResponse({ status: 200, description: 'The service request has been deleted.' })
  @ApiResponse({ status: 404, description: 'Service request not found.' })
  async removeServiceRequest(@Param('id') id: number): Promise<void> {
    return this.requestsService.removeServiceRequest(id);
  }

  // @Get('user/:userId')
  // @ApiOperation({ summary: 'Get all service requests by user id' })
  // @ApiParam({ name: 'userId', description: 'User ID' })
  // @ApiResponse({ status: 200, description: 'Return all service requests for the user.', type: [ServiceRequestsEntity] })
  // async findServiceRequestsByUserId(@Param('userId') userId: number): Promise<ServiceRequestsEntity[]> {
  //   return this.requestsService.findServiceRequestsByUserId(userId);
  // }

  // @Get('technician/:technicianId')
  // @ApiOperation({ summary: 'Get all service requests by technician id' })
  // @ApiParam({ name: 'technicianId', description: 'Technician ID' })
  // @ApiResponse({ status: 200, description: 'Return all service requests for the technician.', type: [ServiceRequestsEntity] })
  // async findServiceRequestsByTechnicianId(@Param('technicianId') technicianId: number): Promise<ServiceRequestsEntity[]> {
  //   return this.requestsService.findServiceRequestsByTechnicianId(technicianId);
  // }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change status of a service request (dashboard)' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiBody({ schema: { properties: { status: { type: 'number', enum: Object.values(RequestStatus) } } } })
  @ApiResponse({ status: 200, description: 'Return the updated service request.', type: ServiceRequestsEntity })
  async changeRequestStatus(
    @Param('id') id: number,
    @Body('status') status: RequestStatus,
  ): Promise<ServiceRequestsEntity> {
    return this.requestsService.changeRequestStatus(id, status);
  }
}
