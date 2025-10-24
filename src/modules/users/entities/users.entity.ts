import {
  Entity,
  Column,
  BeforeInsert,
  AfterLoad,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { hash, genSalt } from 'bcrypt';
import { join } from 'path';
import { BaseEntity }    from '../../../common/baseEntity/baseEntity';
import { UsersTypes, UserStatus } from '../../../common/enums/users.enum';
import { MediaDir } from 'src/common/files/media-dir-.enum';
import { TechnicalProfileEntity } from './technical_profile.entity';
import { UserFcmTokenEntity } from './user-fcm-token.entity';
import { ServiceRequestsEntity } from 'src/modules/requests/entities/service_requests.entity';
import { ReportsEntity } from 'src/modules/reports/entities/reports.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ length: 50, nullable: true })
  username: string;

  @Column({type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string;

  @Column({type: 'varchar', length: 100, unique: true, nullable: true  })
  email: string;

  @Column({ type: 'varchar', enum: UserStatus, default: UserStatus.UNVERIFIED })
  status: UserStatus;

  @Column({ type: 'enum', enum: UsersTypes, nullable: true })
  type: UsersTypes;

  @Column({ type: 'text', nullable: true })
  image: string;

  // @Column({ type: 'text', nullable: true })
  // @JoinColumn({ name: 'image_id' })
  // imageId: string;

  @Column({ length: 255, nullable: true })
  password: string;
  
  @Column({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastLoginAt: Date;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  arAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  enAddress: string;
  
  @OneToOne(() => TechnicalProfileEntity, technicalProfile => technicalProfile.user, { cascade: true })
  technicalProfile: TechnicalProfileEntity;

  @OneToMany(() => UserFcmTokenEntity, fcmToken => fcmToken.user, { cascade: true })
  fcmTokens: UserFcmTokenEntity[];

  @OneToMany(() => ServiceRequestsEntity, serviceRequests => serviceRequests.user)
  serviceRequests: ServiceRequestsEntity[];

  @OneToMany(() => ServiceRequestsEntity, serviceRequests => serviceRequests.technician)
  implementedRequests: ServiceRequestsEntity[];
  
  @OneToMany(() => ReportsEntity, reports => reports.reported || reports.reporter)
  reports: ReportsEntity[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await genSalt(10);
      this.password = await hash(this.password, salt);
    }
  }

  // @AfterLoad()
  // async MediaUrl() {
  //   if (typeof this.image === 'string' && process.env.APP_URL) {
  //     const fullPath = join(process.env.MEDIA_DIR, MediaDir.PROFILES, this.image);
  //     this.image = `${process.env.APP_URL}/${fullPath}`;
  //   }
  // }
}
