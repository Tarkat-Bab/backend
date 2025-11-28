import { MigrationInterface, QueryRunner } from "typeorm";

export class UserLang1764373923262 implements MigrationInterface {
    name = 'UserLang1764373923262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "used_language" character varying NOT NULL DEFAULT 'en'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "used_language"`);
    }

}
