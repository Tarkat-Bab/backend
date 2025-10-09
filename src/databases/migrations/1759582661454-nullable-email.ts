import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableEmail1759582661454 implements MigrationInterface {
    name = 'NullableEmail1759582661454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
    }

}
