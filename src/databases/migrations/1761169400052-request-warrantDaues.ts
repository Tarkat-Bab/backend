import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestWarrantDaues1761169400052 implements MigrationInterface {
    name = 'RequestWarrantDaues1761169400052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "remaining_warranty_days" integer NOT NULL DEFAULT '20'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "remaining_warranty_days"`);
    }

}
