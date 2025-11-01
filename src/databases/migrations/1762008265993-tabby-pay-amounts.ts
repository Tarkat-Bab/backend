import { MigrationInterface, QueryRunner } from "typeorm";

export class TabbyPayAmounts1762008265993 implements MigrationInterface {
    name = 'TabbyPayAmounts1762008265993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "technician_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "platform_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "tax_amount" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tax_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "platform_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "technician_amount"`);
    }

}
