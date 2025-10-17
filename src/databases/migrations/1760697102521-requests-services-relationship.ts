import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestsServicesRelationship1760697102521 implements MigrationInterface {
    name = 'RequestsServicesRelationship1760697102521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_6961087379b5aa08f1ec21ee22c"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "requests_id"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "service_id" integer`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_1c2a35adb9aed8807aae3d51ee7" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_1c2a35adb9aed8807aae3d51ee7"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "service_id"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "requests_id" integer`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_6961087379b5aa08f1ec21ee22c" FOREIGN KEY ("requests_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
