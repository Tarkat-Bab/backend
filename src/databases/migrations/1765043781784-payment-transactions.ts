import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentTransactions1765043781784 implements MigrationInterface {
    name = 'PaymentTransactions1765043781784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL, "merchant_email" character varying, "transaction_no" character varying NOT NULL, "merchant_order_number" character varying NOT NULL, "order_status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "payment_id" integer, CONSTRAINT "UQ_72a212f192b4e66d55b5f60e99d" UNIQUE ("transaction_no"), CONSTRAINT "REL_ea2948fea32230f62fe5850be4" UNIQUE ("payment_id"), CONSTRAINT "PK_16750929a49604d6fda70b3bc2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_ea2948fea32230f62fe5850be48" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_ea2948fea32230f62fe5850be48"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
    }

}
