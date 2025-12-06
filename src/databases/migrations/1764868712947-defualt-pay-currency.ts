import { MigrationInterface, QueryRunner } from "typeorm";

export class DefualtPayCurrency1764868712947 implements MigrationInterface {
    name = 'DefualtPayCurrency1764868712947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'SAR'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "currency" DROP DEFAULT`);
    }

}
