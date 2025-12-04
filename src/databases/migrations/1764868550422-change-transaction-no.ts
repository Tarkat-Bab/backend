import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTransactionNo1764868550422 implements MigrationInterface {
    name = 'ChangeTransactionNo1764868550422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_68d18b0a291a71adb36d5997262"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tabby_payment_id"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "transaction_number" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_0337bb6edc2e54726b81c9e2182" UNIQUE ("transaction_number")`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_0337bb6edc2e54726b81c9e2182"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "transaction_number"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "tabby_payment_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_68d18b0a291a71adb36d5997262" UNIQUE ("tabby_payment_id")`);
    }

}
