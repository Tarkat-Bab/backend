import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { RegionEntity } from "./regions.entity";

@Entity('cities')
export class CitiesEntity extends BaseEntity{
    @Column({type: 'varchar', length: 100})
    arName: string;
 
    @Column({type: 'varchar', length: 100})
    enName: string;
    
   @Column({ type: 'double precision', nullable: true })
    latitude: number;

    @Column({ type: 'double precision', nullable: true })
    longitude: number;

    @Column({type: 'boolean', default: false})
    available: boolean;

    @ManyToOne(() => RegionEntity, (region) => region.cities, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'region_id' })
    region: RegionEntity;
}