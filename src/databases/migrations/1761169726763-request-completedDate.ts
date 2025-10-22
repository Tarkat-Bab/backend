import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestCompletedDate1761169726763 implements MigrationInterface {
    name = 'RequestCompletedDate1761169726763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "completed_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "completed_at"`);
    }

}
