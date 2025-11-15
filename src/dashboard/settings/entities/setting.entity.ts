import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('settings')
export class SettingEntity {
   @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 5, scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
    })    
    clientPercentage: number;

    @Column({ type: 'decimal', precision: 5, scale: 2,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
     })    
    taxPercentage: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 20,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        }
     })
    technicianPercentage: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        },
        nullable: true
     })
    clientMaxDiscount: number;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value)
        },
        nullable: true
     })
    technicianMaxDiscount: number;
}