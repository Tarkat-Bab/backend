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
import { FilterUsersDto } from '../dtos/filter-user-dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,

    @InjectRepository(TechnicalProfileEntity)
    private readonly technicalProfileRepo: Repository<TechnicalProfileEntity>,

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
    // const hashPassword = await hash(password, 10);
    // console.log('Hashed Password:', hashPassword); // Debugging line to check hashed password
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
    // console.log('Password Match:', correctPassword); // Debugging line to check password match result
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

    if(existUser.status === UserStatus.UNVERIFIED){
      if(lang === LanguagesEnum.ENGLISH){
        throw new UnauthorizedException('Your account is unverified, please verify your email.');
      } else if(lang === LanguagesEnum.ARABIC){
        throw new UnauthorizedException('حسابك غير مفعل، يرجى التحقق من رقم الهاتف.');
      }
    }

    // Create a new object without the location property
    const { location: _, ...rest } = registerDto;
    const dataToUpdate: any = { ...rest };
    
    
    if (location) {
      let parsedLocation = location as any;
      if (typeof location === 'string') {
        try {
        parsedLocation = JSON.parse(location);
      } catch {
        throw new BadRequestException('Invalid location format');
      }
      }
      const { latitude, longitude, address } = parsedLocation;
      
      let saveLocation = null;
      if(address){
          saveLocation = await this.locationService.getLatLongFromText(address, lang);
        }else{
          saveLocation = await this.locationService.geolocationAddress(latitude, longitude);
      }

      dataToUpdate.latitude  = saveLocation.latitude;
      dataToUpdate.longitude = saveLocation.longitude;
      dataToUpdate.arAddress = saveLocation.ar_address;
      dataToUpdate.enAddress = saveLocation.en_address;
    }

    if (image) {
      const savedImage = await this.fileService.saveFile(image, MediaDir.PROFILES);
      dataToUpdate.image = savedImage.path;
    }
    await this.usersRepo.update({ id: existUser.id }, dataToUpdate);
    return await this.findById(existUser.id);
  }
  
  async list(filter: FilterUsersDto, lang: LanguagesEnum) {
    const { page, limit, username, type } = filter;
    const take = limit ?? 20;
    const skip = ((page ?? 1) - 1) * take;

    const addressColumn =
      lang === LanguagesEnum.ARABIC ? 'u.arAddress' : 'u.enAddress';

    const query = this.usersRepo
      .createQueryBuilder('u')
      .where('u.deleted = :deleted', { deleted: false })
      .andWhere('u.type = :type', { type })
      .select([
        'u.id AS id',
        'u.type AS type',
        'u.username AS username',
        'u.image AS image',
        'u.createdAt AS createdAt',
        'u.status AS status',
        `${addressColumn} AS address`, 
      ]);

    if (type === UsersTypes.TECHNICAL) {
      query
        .leftJoin('u.technicalProfile', 'tech')
        .addSelect(['tech.id AS techId', 'tech.avgRating AS avgRating']);
    }

    if (username) {
      query.andWhere('u.username ILIKE :username', {
        username: `%${username}%`,
      });
    }

    query
      .take(take)
      .skip(skip)
      .orderBy('u.createdAt', 'ASC');

    // ✅ Instead of getRawAndCount()
    const [rows, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);


    const result = rows.map((u) => {
      const isTechnical = !!u.techid;
      const isUser = u.type === UsersTypes.USER;

      return {
        id: u.id,
        username: u.username,
        image: u.image,
        createdAt: u.createdat,
        address: u.address,
        status: u.status,
        totalOrders: isUser ? Number(u.orderscount ?? 0) : undefined,
        avgRating: isTechnical ? Number(u.avgrating ?? 0) : undefined,
        completedOrders: isTechnical ? Number(u.completedorders ?? 0) : undefined,
      }
    });

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

async findById(id: number, lang?: LanguagesEnum): Promise<UserEntity> {
  const addressColumn =
    lang === LanguagesEnum.ARABIC ? 'u.arAddress' : 'u.enAddress';

  let query = this.usersRepo
    .createQueryBuilder('u')
    .where('u.deleted = :deleted', { deleted: false })
    .andWhere('u.id = :id', { id })
    .select([
      'u.id AS id',
      'u.type AS type',
      'u.username AS username',
      'u.image AS image',
      'u.createdAt AS createdAt',
      'u.phone AS phone',
      'u.status AS status',
      `${addressColumn} AS address`,
    ]);

  let existUser = await query.getRawOne();

  if (!existUser) {
    throw new NotFoundException(
      lang === LanguagesEnum.ARABIC
        ? 'المستخدم غير موجود.'
        : 'User not found.'
    );
  }

  if (existUser.type === UsersTypes.TECHNICAL) {
    query = this.usersRepo
      .createQueryBuilder('u')
      .leftJoin('u.technicalProfile', 'tech')
      .where('u.deleted = :deleted', { deleted: false })
      .andWhere('u.id = :id', { id })
      .select([
        'u.id AS id',
        'u.username AS username',
        'u.phone AS phone',
        'u.type AS type',
        'u.image AS image',
        'u.createdAt AS createdAt',
        'u.status AS status',
        `${addressColumn} AS address`,
        'tech.id AS techId',
        'tech.avgRating AS avgRating',
      ]);

    existUser = await query.getRawOne();
  }

  const isTechnical = existUser?.type === UsersTypes.TECHNICAL;
  const isUser = existUser?.type === UsersTypes.USER;

  return {
    id: existUser.id,
    username: existUser.username,
    createdAt: existUser.createdat,
    phone: existUser.phone,
    address: existUser.address,
    image: existUser.image,
    status: existUser.status,
    totalOrders: isUser ? Number(existUser.orderscount ?? 0) : undefined,
    reports: Number(existUser.reportssubmitted ?? 0),
    avgRating: isTechnical ? Number(existUser.avgrating ?? 0) : undefined,
    completedOrders: isTechnical
      ? Number(existUser.completedorders ?? 0)
      : undefined,
  } as unknown as UserEntity;
}

  async findUserForGuard(id:number){
    return await this.usersRepo.findOne({
      where: { id, deleted: false },
      select: { id: true, email: true, phone: true, type: true, status: true }
    })
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

  async userProfile(userID: number, lang: LanguagesEnum) {
    let user: any;
    try{
      let user = await this.usersRepo.findOne({
        where: { id: userID, deleted: false, status: UserStatus.ACTIVE },
        relations: ['technicalProfile'],
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          image: true,
          arAddress: true,
          enAddress: true,
          type: true,
          technicalProfile: { id: true, description: true }
        },
      });

      if (!user) {
        if(lang === LanguagesEnum.ENGLISH){
           throw new NotFoundException('User not found.');
        } else if(lang === LanguagesEnum.ARABIC){
           throw new NotFoundException('المستخدم غير موجود.');
        }
      }

      if(user.type !== UsersTypes.ADMIN){
        delete user.email;
        // delete user.type;
      }

      let userdata = {
        ...user,
        address: lang === LanguagesEnum.ARABIC ? user.arAddress : user.enAddress,
      };
      delete userdata.arAddress;
      delete userdata.enAddress;

     if(user.type === UsersTypes.TECHNICAL){
        return {
          id: userdata.id,
          username: userdata.username,
          phone: userdata.phone,
          description: userdata.technicalProfile?.description,
          image: userdata.image,
          address: userdata.address,
        }
     }
     else if(user.type === UsersTypes.USER){
        delete userdata.technicalProfile;
     }
      return userdata;
    }catch(error){
      console.error('Query Failed: ', error)
    }
    return user;
  } 

  async updateProfile(
    userId: number,
    updateDto: UpdateProfileDto,
    image?: Express.Multer.File,
    lang: LanguagesEnum = LanguagesEnum.ENGLISH
  ){
    const {location, description, username} = updateDto;
    
    const user = await this.findById(userId, lang);
    if(description){
      const technicalProfile = await this.technicalProfileRepo.findOne({
        where: { user: { id: userId } }
      });
      if(technicalProfile){
        await this.technicalProfileRepo.update(
          { id: technicalProfile.id },
          { description: description }
        );
      }

    }

    if (location) {
      let parsedLocation = location as any;
      if (typeof location === 'string') {
        try {
        parsedLocation = JSON.parse(location);
      } catch {
        throw new BadRequestException('Invalid location format');
      }
      }
      const { latitude, longitude, address } = parsedLocation;
      
      let saveLocation = null;
      if(address){
          saveLocation = await this.locationService.getLatLongFromText(address, lang);
        }else{
          saveLocation = await this.locationService.geolocationAddress(latitude, longitude);
      }

      user.latitude  = saveLocation.latitude;
      user.longitude = saveLocation.longitude;
      user.arAddress = saveLocation.ar_address;
      user.enAddress = saveLocation.en_address;
    }
    
    if (image) {
      if(user.image){
        await this.fileService.deleteFiles([user.image], MediaDir.PROFILES, true);
      }
      const savedImage = await this.fileService.saveFile(image, MediaDir.PROFILES);
      user.image = savedImage.path;
    }
    if(username) user.username = username;

    await this.usersRepo.save(user);
    return this.userProfile(userId, lang);
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
    const { phone, location, ...rest } = registerDto;
    const dataToUpdate: any = { ...rest };

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

    if (location) {
      let parsedLocation = location as any;
      if (typeof location === 'string') {
        try {
        parsedLocation = JSON.parse(location);
      } catch {
        throw new BadRequestException('Invalid location format');
      }
      }
      const { latitude, longitude, address } = parsedLocation;
      
      let saveLocation = null;
      if(address){
          saveLocation = await this.locationService.getLatLongFromText(address, lang);
        }else{
          saveLocation = await this.locationService.geolocationAddress(latitude, longitude);
      }

      dataToUpdate.latitude  = saveLocation.latitude;
      dataToUpdate.longitude = saveLocation.longitude;
      dataToUpdate.arAddress = saveLocation.ar_address;
      dataToUpdate.enAddress = saveLocation.en_address;
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
