import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnNamesPay1762078011321 implements MigrationInterface {
    name = 'ChangeColumnNamesPay1762078011321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_5aca55f075f4536515ebca68f81"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_tabby_id"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "tabby_payment_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_68d18b0a291a71adb36d5997262" UNIQUE ("tabby_payment_id")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "client_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "currency" character varying(3) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "currency" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "client_amount"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_68d18b0a291a71adb36d5997262"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "tabby_payment_id"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "payment_tabby_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_5aca55f075f4536515ebca68f81" UNIQUE ("payment_tabby_id")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "expires_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_technical_profiles" FOREIGN KEY ("technician_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
