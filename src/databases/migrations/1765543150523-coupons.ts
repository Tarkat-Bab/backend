import { MigrationInterface, QueryRunner } from "typeorm";

export class Coupons1765543150523 implements MigrationInterface {
    name = 'Coupons1765543150523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "total_client_amount_after_discount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "discount_amount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "coupon_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "coupon_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "discount_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "total_client_amount_after_discount"`);
    }

}
