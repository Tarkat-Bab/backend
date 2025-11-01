import { MigrationInterface, QueryRunner } from "typeorm";

export class DashboardSettingsTechnicna1762010602756 implements MigrationInterface {
    name = 'DashboardSettingsTechnicna1762010602756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD "technician_percentage" numeric(5,2) NOT NULL DEFAULT '20'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "technician_percentage"`);
    }

}
