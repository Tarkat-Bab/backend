import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('settings')
export class SettingEntity {
   @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })    
    platformPercentage: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })    
    taxPercentage: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
    technicianPercentage: number;
}