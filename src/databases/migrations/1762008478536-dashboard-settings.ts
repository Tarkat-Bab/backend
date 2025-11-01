import { MigrationInterface, QueryRunner } from "typeorm";

export class DashboardSettings1762008478536 implements MigrationInterface {
    name = 'DashboardSettings1762008478536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "platform_percentage" numeric(5,2) NOT NULL, "tax_percentage" numeric(5,2) NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`ALTER TABLE "payments" ADD "technician_amount" numeric(10,2) NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "payments" ADD "platform_amount" numeric(10,2) NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "payments" ADD "tax_amount" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tax_amount"`);
        // await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "platform_amount"`);
        // await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "technician_amount"`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
