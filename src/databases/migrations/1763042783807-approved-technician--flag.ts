import { MigrationInterface, QueryRunner } from "typeorm";

export class ApprovedTechnicianFlag1763042783807 implements MigrationInterface {
    name = 'ApprovedTechnician-Flag1763042783807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "approved" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "approved"`);
    }

}
