import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagesIds1761074664657 implements MigrationInterface {
    name = 'ImagesIds1761074664657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests_media" ADD "media_id" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "image_id" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image_id"`);
        await queryRunner.query(`ALTER TABLE "requests_media" DROP COLUMN "media_id"`);
    }

}
