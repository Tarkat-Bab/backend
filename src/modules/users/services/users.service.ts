import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus, UsersTypes } from 'src/common/enums/users.enum';
import { UserEntity } from '../entities/users.entity';
import { TechnicalProfileEntity } from '../entities/technical_profile.entity';
import { In, Repository } from 'typeorm';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { FilesService } from 'src/common/files/files.services';
import { RegisterDto, TechnicalRegisterDto, UserRegisterDto } from '../../auth/dtos/register.dto';
import { AdminLoginDto, LoginDto } from '../../auth/dtos/login.dto';
import { compare, genSalt, hash } from 'bcrypt';
import { UpdateProfileDto } from '../dtos/UpdateProfileDto';
import { ResetPasswordDto } from 'src/modules/auth/dtos/reset-password.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { LocationService } from 'src/modules/locations/location.service';
import { MediaDir } from 'src/common/files/media-dir-.enum';
import { NationaltiesService } from 'src/modules/nationalties/nationalties.service';
import { ServicesService } from 'src/modules/services/services.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly paginatorService: PaginatorService,
    private readonly fileService: FilesService,
    private readonly locationService: LocationService,
    private readonly nationalityService: NationaltiesService,
    private readonly serviceService: ServicesService,
  ) {}
  async createUser(loginDto: LoginDto, lang: LanguagesEnum) {
    const existingUser = await this.checkUserExist({ email: null, phone: loginDto.phone, type: UsersTypes.USER });
    if(existingUser){
      return;
    }

    // Prepare user data
    const userData: any = {
      ...loginDto,
      lastLoginAt: new Date(),
      status: UserStatus.UNVERIFIED
    };
    
    // Add location data if provided
    // if (location) {
    //   const { latitude, longitude } = location;
    //   userData.latitude = latitude;
    //   userData.longitude = longitude;
    // }

    const newUser = this.usersRepo.create(userData);
    
    try {
      const savedUser = await this.usersRepo.save(newUser);
      // Only exclude password if it exists
      const { password, ...userData } = savedUser as any;
      return userData;
    } catch(error) {
      console.log("Query failed:", error);
    }
  }

  async adminLogin(loginDto: AdminLoginDto, lang: LanguagesEnum) {
    const { email, password } = loginDto;
    const hashPassword = await hash(password, 10);
    console.log('Hashed Password:', hashPassword); // Debugging line to check hashed password
    const existUser = await this.usersRepo.findOne({
      where: {
        email,
        deleted: false,
        type: UsersTypes.ADMIN
      },
      select:{
        id: true, 
        status: true,
        type: true,
        email: true,
        lastLoginAt: true,
        password: true,
      }
    });

    if (!existUser){
      if(lang === LanguagesEnum.ENGLISH){
        throw new BadRequestException('Invalid email or password.');
      } else if(lang === LanguagesEnum.ARABIC){
        throw new BadRequestException('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
    } 

    const correctPassword = await compare(password, existUser.password);
    if (!correctPassword){
      if(lang === LanguagesEnum.ENGLISH){
        throw new BadRequestException('Invalid email or password.');
      } else if(lang === LanguagesEnum.ARABIC){
        throw new BadRequestException('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
    }

    await this.usersRepo.update(
      { id: existUser.id },
      { lastLoginAt: new Date() },
    );

    const { password: _, ...user } = existUser;
    return user;
  }

  async publicLogin(loginDto: LoginDto, lang: LanguagesEnum) {
    const { phone, type } = loginDto;
    const existUser = await this.usersRepo.findOne({
      where: {
        phone,
        type,
        deleted: false,
      },
      relations:{ },
      select:{
        id: true, 
        status: true,
        type: true,
        phone: true
      }
    })

    if (!existUser){
      return {
        user: await this.createUser({ phone, type: UsersTypes.USER }, lang),
        newUser: true
      }
    }

    if(existUser.status === UserStatus.BLOCKED){
      if(lang === LanguagesEnum.ENGLISH){
        throw new UnauthorizedException('Your account has been blocked, please contact support.');
      } else if(lang === LanguagesEnum.ARABIC){
        throw new UnauthorizedException('تم حظر حسابك، يرجى الاتصال بالدعم.');
      }

    }
    await this.usersRepo.update(
      { id: existUser.id },
      { lastLoginAt: new Date() },
    );

    return {
      user: existUser,
      newUser: false
    }
  }

  async updateUser(registerDto: UserRegisterDto, lang: LanguagesEnum, image?: Express.Multer.File) {
    const { phone, location } = registerDto;
    const existUser = await this.usersRepo.findOne({ where: { phone } });
   
    if (!existUser) {
      if (lang === LanguagesEnum.ENGLISH) {
        throw new NotFoundException('User not found.');
      } else if (lang === LanguagesEnum.ARABIC) {
        throw new NotFoundException('المستخدم غير موجود.');
      }
    }

    // Create a new object without the location property
    const { location: _, ...rest } = registerDto;
    const dataToUpdate: any = { ...rest };
    
    // Add coordinates if location is provided
    if (location) {
      const { latitude, longitude } = location;
      const coordinates = await this.locationService.createPoint(latitude, longitude);
      dataToUpdate.latitude = coordinates.latitude;
      dataToUpdate.longitude = coordinates.longitude;
    }

    if (image) {
      const savedImage = await this.fileService.saveFile(image, MediaDir.PROFILES);
      dataToUpdate.image = savedImage.path;
    }
    await this.usersRepo.update({ id: existUser.id }, dataToUpdate);
    return await this.findById(existUser.id);
  }
  
  async list(filter: any, userId: number ) {
    const {
      page ,
      limit,
      email,
      phone,
      active,
      type,
      createdAt,
      lastLoginAt,
      sortBy,
      sortOrder,
    } = filter;
    const take = limit ?? 20;
    const skip = ((page ?? 1) - 1) * take;

    const query = this.usersRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.parent', 'p')
      .leftJoinAndSelect('u.governorate', 'g')
      .select([
        'u.id',
        'u.firstName',
        'u.middleName',
        'u.lastName',
        'u.',
        'u.parent',
        'p.name',
        'p.job',
        'g.arName',
        'u.type',
        'u.email',
        'u.phone',
        'u.active',
        'u.createdAt',
        'u.lastLoginAt',
      ])
      .where('u.deleted=false');

    if (email) query.andWhere('u.email ILIKE :email', { email: `%${email}%` });
    if (phone) query.andWhere('u.phone ILIKE :phone', { phone: `%${phone}%` });

    if (active !== undefined)
      query.andWhere('u.active = :active', { active });

    if( type !== undefined  ){
      query.andWhere('u.type = :type', { type });
    }

    if (createdAt) {
      const [year, month, day] = createdAt.split('-').map(Number);
      const createdFrom = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`;
      const createdTo = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`;
      query.andWhere(
        'u.createdAt >= :createdFrom And u.createdAt < :createdTo',
        { createdFrom, createdTo },
      );
    }

    if (lastLoginAt) {
      const [year, month, day] = lastLoginAt.split('-').map(Number);
      const lastLoginFrom = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`;
      const lastLoginTo = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`;
      query.andWhere(
        'u.lastLoginAt >= :lastLoginFrom And u.lastLoginAt < :lastLoginTo',
        { lastLoginFrom, lastLoginTo },
      );
    }

    query.limit(take).offset(skip).orderBy(`u.${sortBy}`, sortOrder);

    const [result, total] = await query.andWhere('u.id != :id', { id: userId }).getManyAndCount();
    return this.paginatorService.makePaginate(result, total, take, page);
  }  

  async removeUsers(ids: number[], user: { id: number }, type: UsersTypes) {
    const { id } = user;
    const batchSize = 50;
    let users: UserEntity[];

    do {
      users = await this.usersRepo.find({
        where: {
          id: In(ids),
          deleted: false,
          type,
        },
        take: batchSize,
        order: { id: 'asc' },
        select: { id: true },
      });

      if (users.length > 0) {
        await this.usersRepo.update(
          { id: In(users.map((u) => u.id)) },
          {
            deleted: true,
            deletedBy: id,
            deletedAt: new Date(),
          },
        );
      }
    } while (users.length === batchSize);
    return true;
  }

  async checkUserExist(
    dto: {
      email?: string | null;
      phone: string | null;
      type?: UsersTypes;
    },
  ) {

    let { email, phone, type } = dto;
    
    // Build where conditions based on available data
    const whereConditions = [];
    type? type : In([UsersTypes.USER, UsersTypes.TECHNICAL]);
    if (email) {
      whereConditions.push({ email, type });
    }
    
    if (phone) {
      whereConditions.push({ phone, type });
    }
    
    if (whereConditions.length === 0) {
      return;
    }
    
    const existingUser = await this.usersRepo.findOne({
      where: whereConditions,
      select: { id: true, email: true, phone: true, type: true },
    });
    
    if (existingUser) {
      return existingUser;
    }

    return;
  }

  async findById(id: number) {
    let existUser = null;
    existUser =  await this.usersRepo.findOne({
      where: { id, deleted: false },
      select: {
        id: true,
        username: true,
        type: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        image: true,
      },
      
    });
    if (!existUser) {
       throw new BadRequestException()
    }
    return existUser;
  }


  async findByEmail(email: string, lang: LanguagesEnum, status?: UserStatus) {
    const user = await this.usersRepo.findOne({
      where: {
        email: email,
        deleted: false,
      },
      select:{ id: true, email: true, password: true, type: true, status: true, username: true }
    });

    if (!user){
      if(lang === LanguagesEnum.ENGLISH){
         throw new NotFoundException('Invalid email.');
      } else if(lang === LanguagesEnum.ARABIC){
         throw new NotFoundException('البريد الإلكتروني غير صحيح.');
      }
      }

      if( user && status && user.status === UserStatus.BLOCKED ){
        if(lang === LanguagesEnum.ENGLISH){
          throw new UnauthorizedException('Your account has been blocked, please contact support.');
        }
        else if(lang === LanguagesEnum.ARABIC){
          throw new UnauthorizedException('تم حظر حسابك، يرجى الاتصال بالدعم.');
        }
      }
    return user;
  }

  async changeUserStatus(id: number, status: UserStatus){
    const user = await this.findById(id);
    await this.usersRepo.update(user.id, { status })
  }

  async userProfile(userID: number ){
    let user: any;
    try{
      user = await this.usersRepo.findOne({
        where: { id: userID, deleted: false, status: UserStatus.ACTIVE },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          username: true,
          phone: true,
          email: true,
          lastLoginAt: true,
          image: true,
          latitude: true,
          longitude :true
        },
      });
    }catch(error){
      console.error('Query Failed: ', error)
    }
    
    return user;
  } 

  async updateProfile(
    userId: number,
    updateDto: UpdateProfileDto,
    image?: Express.Multer.File,
  ): Promise<UserEntity> {
    const existUser = await this.findById(userId);
    
    let imagePath: string = null;
    if(image){
        const savedImage = await this.fileService.saveFile(image, 'units');
        imagePath = savedImage.path;
    }

    await this.usersRepo.update(
      { id: userId },
      {
        ...updateDto,
        image: imagePath,
      },
    );
    return existUser;
  }

  async deleteAccount(user: { id: number }): Promise<void> {
    const existUser = await this.usersRepo.findOne({
      where: { id: user.id, deleted: false },
      select: { id: true, image: true },
    });
    if (!existUser) return;
    await this.usersRepo.update(
      { id: user.id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    );
    if (existUser?.image) return;
    //   void (await this.filesService.deleteFiles(
    //     [existUser.image],
    //     MediaFolders.Profiles,
    //     true,
    //   ));
  }

  async getUsersForReport() {
    const query = this.usersRepo
      .createQueryBuilder('u')
      .select([ 
        'u.id',
        'u.active',
        'u.type',
        'u.deleted',
        'u.blocked',
      ])
      .getMany();

      return await query;
  }

  async generateUserTypeReport(type: UsersTypes) {
    const result = await this.usersRepo
      .createQueryBuilder('u')
      .select([
        'COUNT(*) as total',
        `COUNT(CASE WHEN u.active = true AND u.deleted = false AND u.blocked = false THEN 1 END) as active`,
        `COUNT(CASE WHEN u.active = false AND u.deleted = false AND u.blocked = false THEN 1 END) as inactive`,
        `COUNT(CASE WHEN u.deleted = true THEN 1 END) as deleted`,
        `COUNT(CASE WHEN u.blocked = true AND u.deleted = false THEN 1 END) as blocked`,
      ])
      .where('u.type = :type', { type })
      .getRawOne();
    
    return {
      [`total${type}s`]: Number(result.total),
      [`active${type}s`]: Number(result.active),
      [`inactive${type}s`]: Number(result.inactive),
      [`deleted${type}s`]: Number(result.deleted),
      [`blocked${type}s`]: Number(result.blocked),
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, lang: LanguagesEnum) {
    const user = await this.findByEmail(resetPasswordDto.email, lang);
    if(user.status === UserStatus.UNVERIFIED) {
      if(lang === LanguagesEnum.ENGLISH){
        throw new BadRequestException('Account is not activated, please enter the verification code sent to your email or request a new code.');
      }
      else if(lang === LanguagesEnum.ARABIC){
        throw new BadRequestException('الحساب غير مفعل، برجاء إدخال رمز التحقق المرسل إلى بريدك الإلكتروني أو طلب إعادة إرسال رمز جديد');
      }
    }
    const salt = await genSalt(10);
    user.password = await hash(resetPasswordDto.newPassword, salt);
    user.status = UserStatus.ACTIVE;
    
    return await this.usersRepo.save(user);
  }

  async oAuthRegister(user): Promise<any> {
    const { email, phone, username } = user;
    const existUser = await this.usersRepo.findOne({
      where: { email: user?.email, phone: user?.phone, deleted: false },
    });

    const userData = existUser
      ? existUser
      : await this.usersRepo.save({ email, phone, username, type: UsersTypes.USER, status: UserStatus.ACTIVE });
    return userData;
  }

  async updateTechnical( registerDto: TechnicalRegisterDto,
    lang: LanguagesEnum = LanguagesEnum.ENGLISH,
    image?: Express.Multer.File,
    workLicenseImage?: Express.Multer.File,
    identityImage?: Express.Multer.File
  ) {
    // Verify the user exists and is a technical user
    const { phone } = registerDto;
    const user = await this.usersRepo.findOne({
      where: { 
        phone,
        deleted: false, 
        type: UsersTypes.TECHNICAL 
      },
      relations: ['technicalProfile']
    });

    if (!user) {
      throw new NotFoundException(
        lang === LanguagesEnum.ENGLISH 
          ? 'Technical user not found' 
          : 'المستخدم الفني غير موجود'
      );
    }

    // Process the profile image if provided
    let imagePath: string | undefined;
    let workLicensePath: string | undefined;
    let identityPath: string | undefined;

    if(image){
      const savedImage = await this.fileService.saveFile(image, MediaDir.PROFILES);
      imagePath = savedImage.path;
    }

    if (identityImage) {
      const savedImage = await this.fileService.saveFile(identityImage, MediaDir.IDENTITY);
      identityPath = savedImage.path;
    }

    if (workLicenseImage) {
      const savedWorkLicense = await this.fileService.saveFile(workLicenseImage, MediaDir.WORKLICENSE);
      workLicensePath = savedWorkLicense.path;
    }
    // // Create technical profile if it doesn't exist
    // if (!user.technicalProfile) {
    //   const technicalProfile = new TechnicalProfileEntity();
    //   technicalProfile.user = user;
    //   user.technicalProfile = technicalProfile;
    // }

    // Update basic user data
    if (user.username) user.username = user.username;
    if (user.phone) user.phone = user.phone;
    if (imagePath) user.image = imagePath;

    const nationality = await this.nationalityService.findOne(registerDto.nationalityId, lang);
    user.technicalProfile.nationality = nationality;

    const service = await this.serviceService.findOne(registerDto.serviceId, lang);
    if (!user.technicalProfile.services) {
      user.technicalProfile.services = [];
    }
    user.technicalProfile.services.push(service);

    user.technicalProfile.workLicenseImage = workLicensePath;
    user.technicalProfile.identityImage = identityPath;

    // Update location if provided
    if (registerDto.location) {
      const { latitude, longitude } = registerDto.location;
      if (latitude && longitude) {
        user.latitude = latitude;
        user.longitude = longitude;
      }
    }

    // Save changes
    const updatedUser = await this.usersRepo.save(user);

    // Remove circular references before returning
    if (updatedUser.technicalProfile) {
      // Remove the user property from technicalProfile to avoid circular JSON
      updatedUser.technicalProfile.user = undefined;
    }

    const { password, ...result } = updatedUser;
    return result;
  }
}
