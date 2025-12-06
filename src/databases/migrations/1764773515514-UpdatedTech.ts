import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedTech1764773515514 implements MigrationInterface {
    name = 'UpdatedTech1764773515514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" RENAME COLUMN "id_updated" TO "is_updated"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" RENAME COLUMN "is_updated" TO "id_updated"`);
    }

}
