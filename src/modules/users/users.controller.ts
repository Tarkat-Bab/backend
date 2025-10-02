import { Body, Controller, Get, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFilter } from 'src/common/files/files.filter';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UpdateProfileDto } from './dtos/UpdateProfileDto';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}
    
    @Get('profile')
    async getProfile(
        @CurrentUser() user: any
    ) {
        return this.usersService.userProfile(user.id);
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
