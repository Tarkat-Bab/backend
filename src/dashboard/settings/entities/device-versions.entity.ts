import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('device_versions')
export class DeviceVersionsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'jsonb', 
    nullable: true 
  })
  meta: {
    updated_at: string;
    updated_by: string;
    change_reason: string;
  };

  @Column({ 
    type: 'jsonb',
    nullable: true 
  })
  android: {
    exact_blocked_version: string;
    min_supported_version: string;
    maintenance_mode: boolean;
    maintenance_message?: string;
  };

  @Column({ 
    type: 'jsonb',
    nullable: true 
  })
  ios: {
    exact_blocked_version: string;
    min_supported_version: string;
    maintenance_mode: boolean;
    maintenance_message?: string;
  };
}
