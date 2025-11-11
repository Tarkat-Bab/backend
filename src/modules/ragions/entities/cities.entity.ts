import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, ManyToOne } from "typeorm";
import { RegionEntity } from "./ragions.entity";

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


    @ManyToOne(() => RegionEntity, (region) => region.cities, {
        onDelete: 'CASCADE',
    })
    region: RegionEntity;
}