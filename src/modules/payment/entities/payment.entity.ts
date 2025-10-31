import { ServiceRequestsEntity } from "src/modules/requests/entities/service_requests.entity";
import { UserEntity } from "src/modules/users/entities/users.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('payments')
export class PaymentsEntity {
   @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar' })
    currency: string;

    @Column({ type: 'varchar' })
    status: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    expiresAt: Date;

    @ManyToOne(() => UserEntity, (user) => user.payments)
    user: UserEntity;

    @OneToOne(() => ServiceRequestsEntity, (request) => request.payment)
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequestsEntity;
}