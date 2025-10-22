import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { RequestsService } from '../services/requests.service';
import { CreateServiceRequestDto } from '../dto/create-service-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { ServiceRequestsEntity } from '../entities/service_requests.entity';
import { RequestStatus } from '../enums/requestStatus.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterRequestByServiceDto, FilterRequestByStatusDto, FilterRequestDto } from '../dto/filter-request.dto';

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
  ){
    return this.requestsService.createServiceRequest(createServiceRequestDto, user.id, images, lang);
  }

  @Get('client/:id')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference',
    required: false,
    enum: LanguagesEnum
  })
  @ApiOperation({ summary: 'Get a request by id ' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiBearerAuth()
  async findRequestById(
    @CurrentUser() user: any,
    @Param('id') id: number,
    @Language() lang: LanguagesEnum,
  ){
    return this.requestsService.findRequestById(id, lang, user.id);
  }


  @Get('client/all/me')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference',
    required: false,
    enum: LanguagesEnum
  })
  @ApiOperation({ summary: 'Get a client requests' })
  @ApiBearerAuth()
  async findClientRequests(
    @CurrentUser() user: any,
    @Query() filterRequest: FilterRequestByStatusDto,
    @Language() lang: LanguagesEnum,
  ){
    return this.requestsService.findAllServiceRequests(filterRequest, lang, user.id);
  }


  @Get('technician/all/me')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference',
    required: false,
    enum: LanguagesEnum
  })
  @ApiOperation({ summary: 'Get a technician requests' })
  @ApiBearerAuth()
  async findTechnicianRequests(
    @CurrentUser() user: any,
    @Query() filterRequest: FilterRequestByStatusDto,
    @Language() lang: LanguagesEnum,
  ){
    return this.requestsService.findAllServiceRequests(filterRequest, lang, null, user.id);
  }

  @Get('technician/all/global')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference',
    required: false,
    enum: LanguagesEnum
  })
  @ApiOperation({ summary: 'Get all requests for a technician' })
  @ApiBearerAuth()
  async findRequestsForTechnician(
    @Query() filterRequest: FilterRequestByServiceDto,
    @Language() lang: LanguagesEnum,
  ){
    return this.requestsService.findAllServiceRequests(filterRequest, lang);
  }
}
