import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportTypeColumn1761137890007 implements MigrationInterface {
    name = 'ReportTypeColumn1761137890007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests_media" DROP COLUMN "media_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image_id"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "request_id" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_df7eab238c78ab75c2109b0d5ab" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_df7eab238c78ab75c2109b0d5ab"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "request_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "image_id" text`);
        await queryRunner.query(`ALTER TABLE "requests_media" ADD "media_id" text`);
    }

}
