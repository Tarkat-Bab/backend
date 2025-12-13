import { MigrationInterface, QueryRunner } from "typeorm";

export class CouponsActivity1765646039165 implements MigrationInterface {
    name = 'CouponsActivity1765646039165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "first_order_discount" ADD "is_active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "first_order_discount" DROP COLUMN "is_active"`);
    }

}
