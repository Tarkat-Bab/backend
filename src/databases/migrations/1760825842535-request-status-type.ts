import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestStatusType1760825842535 implements MigrationInterface {
    name = 'RequestStatusType1760825842535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'pending'`);
    }

}
