import { MigrationInterface, QueryRunner } from "typeorm";

export class SettingsName1762082439213 implements MigrationInterface {
    name = 'SettingsName1762082439213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" RENAME COLUMN "platform_percentage" TO "client_percentage"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" RENAME COLUMN "client_percentage" TO "platform_percentage"`);
    }

}
