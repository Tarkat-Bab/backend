import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageUrl1764357003818 implements MigrationInterface {
    name = 'MessageUrl1764357003818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "image_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "image_url"`);
    }

}
