import { MigrationInterface, QueryRunner } from "typeorm";

export class ReviewedFlagReq1761890193411 implements MigrationInterface {
    name = 'ReviewedFlagReq1761890193411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "reviewed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "reviewed"`);
    }

}
