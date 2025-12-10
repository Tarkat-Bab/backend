import { MigrationInterface, QueryRunner } from "typeorm";

export class LocationStatusOfUsers1765398400321 implements MigrationInterface {
    name = 'LocationStatusOfUsers1765398400321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "location_status" character varying NOT NULL DEFAULT 'IN_COVERAGE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "blocked_reason" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blocked_reason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location_status"`);
    }

}
