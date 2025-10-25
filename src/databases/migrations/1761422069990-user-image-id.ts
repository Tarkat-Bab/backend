import { MigrationInterface, QueryRunner } from "typeorm";

export class UserImageId1761422069990 implements MigrationInterface {
    name = 'UserImageId1761422069990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "image_id" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image_id"`);
    }

}
