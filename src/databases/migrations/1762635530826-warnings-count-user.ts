import { MigrationInterface, QueryRunner } from "typeorm";

export class WarningsCountUser1762635530826 implements MigrationInterface {
    name = 'WarningsCountUser1762635530826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "warning_count" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "warning_count"`);
    }

}
