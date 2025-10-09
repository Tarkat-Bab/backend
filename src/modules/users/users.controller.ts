import { Body, Controller, Get, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
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

    @ApiConsumes('multipart/form-data')
    @Patch('profile')
    @UseInterceptors(FileInterceptor('image', { fileFilter: imageFilter }))
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateDto: UpdateProfileDto,
        @UploadedFile() image?: Express.Multer.File
    ) {
        return this.usersService.updateProfile(user.id, updateDto, image);
    }

}
