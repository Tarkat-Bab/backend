import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('nationalities')
export class NationalityEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', unique: true })
    arName: string;

    @Column({ type: 'varchar', unique: true })
    enName: string;
}