import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportRepliesFix1761304356059 implements MigrationInterface {
    name = 'ReportRepliesFix1761304356059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports_replies" ADD "report_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ALTER COLUMN "report_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ADD CONSTRAINT "FK_83a856d8103d9937a08160ac769" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports_replies" DROP CONSTRAINT "FK_83a856d8103d9937a08160ac769"`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ALTER COLUMN "report_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports_replies" DROP COLUMN "report_id"`);
    }

}
