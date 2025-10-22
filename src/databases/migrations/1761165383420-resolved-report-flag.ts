import { MigrationInterface, QueryRunner } from "typeorm";

export class ResolvedReportFlag1761165383420 implements MigrationInterface {
    name = 'ResolvedReportFlag1761165383420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" ADD "resolved" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "resolved"`);
    }

}
