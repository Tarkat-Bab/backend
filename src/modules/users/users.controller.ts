import { Body, Controller, Get, Param, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFilter } from 'src/common/files/files.filter';
import { ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { UpdateProfileDto } from './dtos/UpdateProfileDto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}
    
    @ApiHeader({
      name: 'Accept-Language',
      description: 'Language for the response (e.g., ar, en)',
      required: false,
    })    
    @Get('profile')
    async getProfile(
        @CurrentUser() user: any,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.userProfile(user.id, lang);
    }

    @ApiHeader({
      name: 'Accept-Language',
      description: 'Language for the response (e.g., ar, en)',
      required: false,
    }) 
    @ApiConsumes('multipart/form-data')
    @Patch('profile')
    @UseInterceptors(FileInterceptor('image', { fileFilter: imageFilter }))
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateDto: UpdateProfileDto,
        @UploadedFile() image?: Express.Multer.File,
        
    ) {
        return this.usersService.updateProfile(user.id, updateDto, image);
    }

    @ApiHeader({
      name: 'Accept-Language',
      description: 'Language for the response (e.g., ar, en)',
      required: false,
    })
    @Get('technician/:technicianId')
    async listUsers(
        @Param('technicianId') technicianId: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.technicianProfile(technicianId, lang);
    }

    @ApiHeader({
      name: 'Accept-Language',
      description: 'Language for the response (e.g., ar, en)',
      required: false,
    })
    @Get('loguot')
    async logout(
        @CurrentUser() user: any,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.logout(user.id, lang);
    }
}
