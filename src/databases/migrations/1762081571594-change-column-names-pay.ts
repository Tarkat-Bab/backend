import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnNamesPay1762081571594 implements MigrationInterface {
    name = 'ChangeColumnNamesPay1762081571594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "technician_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "platform_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "client_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "total_client_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "total_technician_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "platform_amount_from_tech" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "platform_amount_from_client" numeric(10,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "platform_amount_from_client"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "platform_amount_from_tech"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "total_technician_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "total_client_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "client_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "platform_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "technician_amount" numeric(10,2) NOT NULL`);
    }

}
