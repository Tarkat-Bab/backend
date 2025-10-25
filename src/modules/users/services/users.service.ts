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
import { join } from 'path/win32';
import { CloudflareService } from 'src/common/files/cloudflare.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,

    @InjectRepository(TechnicalProfileEntity)
    private readonly technicalProfileRepo: Repository<TechnicalProfileEntity>,

    private readonly paginatorService: PaginatorService,
    private readonly fileService: FilesService,
    private readonly cloudflareService: CloudflareService,
    private readonly locationService: LocationService,
    private readonly nationalityService: NationaltiesService,
    private readonly serviceService: ServicesService,
  ) {}
  
  async createUser(loginDto: LoginDto, lang: LanguagesEnum) {
    await this.checkUserExist({ email: null, phone: loginDto.phone, type: loginDto.type }, lang);
    
    // Prepare user data
    const userData: any = {
      ...loginDto,
      technicalProfile:{
        
      },
      type: loginDto.type,
      lastLoginAt: new Date(),
      status: UserStatus.UNVERIFIED
    };
    const newUser = this.usersRepo.create(userData);
    
    try {
      const savedUser = await this.usersRepo.save(newUser);
      const { password, ...userData } = savedUser as any;
      return userData;
    } catch(error) {
      console.log("Query failed:", error);
    }
  }

  async adminLogin(loginDto: AdminLoginDto, lang: LanguagesEnum) {
    const { email, password } = loginDto;
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
        user: await this.createUser({ phone, type }, lang),
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
      const savedImage = await this.cloudflareService.uploadFileToCloudflare(image.path);
      dataToUpdate.image = savedImage.url;
      dataToUpdate.imageId = savedImage.id;
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
        .addSelect([
          'tech.id AS techId',
          'tech.avgRating AS avgRating',
          'COUNT(DISTINCT tech.reviews) AS totalReviews',
        ]);
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
        totalReviews: isTechnical ? Number(u.totalreviews ?? 0) : undefined,
      }
    });

    return this.paginatorService.makePaginate(result, total, take, page);
  } 

  async checkUserExist(
    dto: {
      email?: string | null;
      phone: string | null;
      type?: UsersTypes;
    }, lang?: LanguagesEnum
  ) {

    let { email, phone, type } = dto;
    
    const existingUser = await this.usersRepo.findOne({
      where: {
        deleted: false,
        status: In([UserStatus.ACTIVE, UserStatus.UNVERIFIED]),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        // ...(type ? { type } : {}),
      },
      select: { id: true, email: true, phone: true, type: true },
    });

    if (existingUser && type && type !== existingUser.type) {
       if(lang === LanguagesEnum.ARABIC){
          throw new BadRequestException('نوع المستخدم غير متطابق مع السجل الموجود.');
       }else{
          throw new BadRequestException('User type mismatch with existing user.');
       }
       
    }

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
      .leftJoin('u.serviceRequests', 'serviceRequests')
      .leftJoin('u.reportedReports', 'reportedReports')  // Changed from reports to reportedReports
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
        'COUNT(DISTINCT serviceRequests.id) AS ordersCount',
        'COUNT(DISTINCT reportedReports.id) AS reportsSubmitted',
      ])
      .groupBy('u.id');

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

    // Raw query returns flattened keys (lowercased), e.g. techId -> techid, avgRating -> avgrating.
    // Avoid accessing nested objects on the raw result (existUser.technicalProfile is undefined).
    const rawTechId = isTechnical ? Number(existUser.techid ?? existUser.techId ?? 0) : undefined;

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
      type: existUser.type,
      techId: rawTechId,
      technicalProfile: isTechnical ? { id: rawTechId } : undefined,
      avgRating: isTechnical ? Number(existUser.avgrating ?? 0) : undefined,
      completedOrders: isTechnical ? Number(existUser.completedorders ?? 0) : undefined,
    } as unknown as UserEntity;
  }

  async findOne(id: number, lang?: LanguagesEnum){
    let query = this.usersRepo
      .createQueryBuilder('u')
      .where('u.deleted = :deleted', { deleted: false })
      .andWhere('u.id = :id', { id })
      .select([
        'u.id',
        'u.type',
        'u.status',
      ]);

    let existUser = await query.getRawOne();

    if (!existUser) {
      console.log('User not found with ID:', id);
        throw new NotFoundException(
          lang === LanguagesEnum.ARABIC
            ? 'المستخدم غير موجود.'
            : 'User not found.'
        );        
    }

    if (existUser.u_type === UsersTypes.TECHNICAL) {
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
          'tech.id AS techId',
          'tech.avgRating AS avgRating',
          // 'tech.reviews AS reviews',
        ]);

      existUser = await query.getRawOne();
    }

    return existUser;
  }

  async findUserForGuard(id:number){
    return await this.usersRepo.findOne({
      where: { id, deleted: false },
      select: { id: true, email: true, phone: true, type: true, status: true }
    })
  }

  async findTechnicianById(id: number, lang: LanguagesEnum, dashboard?: boolean): Promise<TechnicalProfileEntity> {
    const technician = await this.technicalProfileRepo.findOne({
      where: [
        { id, deleted: false, user: { deleted: false, status: dashboard ? UserStatus.ACTIVE : undefined } },
        { deleted: false, user: { id, deleted: false, status: dashboard ? UserStatus.ACTIVE : undefined } }
      ],
      relations: ['user', 'reviews', 'services'],
      select: {
        id: true,
        avgRating: true,
        description: true,
        user: {
          id: true,
          username: true,
          phone: true,
          image: true,
        },
        reviews: { id: true },
        services: { id: true, enName: true, arName: true, icone: true},
      },
    });
    if (!technician) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`المستخدم الفني غير موجود`);
      } else {
        throw new NotFoundException(`Technician not found`);
      }
    }
    return technician;
  }

  async technicianProfile(id: number, lang: LanguagesEnum, dashboard?: boolean) {
    const technician = await this.technicalProfileRepo.findOne({
      where: [
        { id, deleted: false, user: { deleted: false, status: dashboard ? UserStatus.ACTIVE : undefined } },
        { deleted: false, user: { id, deleted: false, status: dashboard ? UserStatus.ACTIVE : undefined } }
      ],
      relations: ['user', 'reviews', 'services'],
      select: {
        id: true,
        avgRating: true,
        description: true,
        user: {
          id: true,
          username: true,
          phone: true,
          image: true,
        },
        reviews: { id: true },
        services: { id: true, enName: true, arName: true, icone: true},
      },
    });
    if (!technician) {
      if(lang === LanguagesEnum.ARABIC){
        throw new NotFoundException(`المستخدم الفني غير موجود`);
      } else {
        throw new NotFoundException(`Technician not found`);
      }
    }
    return {
      id: technician.id,
      avgRating: technician.avgRating,
      description: technician.description,
      username: technician.user.username,
      phone: technician.user.phone,
      image: technician.user.image,
      services: technician.services.map(s => ({
        id: s.id,
        address: lang === LanguagesEnum.ARABIC ? s.arName : s.enName,
        icone: s.icone,
      })),
      totalReviews: technician.reviews.length ?? 0,
    };
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
          latitude: true,
          longitude: true,
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
      // if(user.imageId) {
      //   try {
      //     await this.cloudflareService.deleteFileFromCloudflare(user.imageId);
      //   } catch (error) {
      //     console.error('Error deleting old image from Cloudflare:', error);
      //   }
      // }
      
      // try {
      //   // Pass the entire image object to the service
      //   const savedImage = await this.cloudflareService.uploadFileToCloudflare(image);
      //   user.image = savedImage.url;
      //   user.imageId = savedImage.id;
      // } catch (error) {
      //   console.error('Error uploading image to Cloudflare:', error);
      //   throw new Error(`Failed to upload profile image: ${error.message}`);
      // }
    }
    
    if(username) user.username = username;

    await this.usersRepo.save(user);
    return this.userProfile(userId, lang);
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

    const updatedUser = await this.usersRepo.save(user);

    if (updatedUser.technicalProfile) {
      updatedUser.technicalProfile.user = undefined;
    }

    const { password, ...result } = updatedUser;
    return result;
  }

  
  async saveTechnicalProfile(technician: TechnicalProfileEntity) {
    return this.technicalProfileRepo.save(technician);
  }
}
