import { BaseEntity } from "src/common/baseEntity/baseEntity";
import { Column, Entity, OneToMany } from "typeorm";
import { CitiesEntity } from "./cities.entity";

@Entity('regions')
export class RegionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  arName: string;

  @Column({ type: 'varchar', length: 100 })
  enName: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @OneToMany(() => CitiesEntity, (city) => city.region, {
    cascade: true,
  })
  cities: CitiesEntity[];
}
