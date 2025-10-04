import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableUsername1759584324331 implements MigrationInterface {
    name = 'NullableUsername1759584324331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);
    }

}
