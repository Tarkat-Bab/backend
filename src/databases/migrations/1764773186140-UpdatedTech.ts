import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedTech1764773186140 implements MigrationInterface {
    name = 'UpdatedTech1764773186140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "id_updated" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "id_updated"`);
    }

}
