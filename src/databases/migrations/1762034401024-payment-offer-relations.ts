import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentOfferRelations1762034401024 implements MigrationInterface {
    name = 'PaymentOfferRelations1762034401024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d64a7332add491c29e75412b627"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "request_id" TO "offer_id"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_08c5a24b6482391b6dfd90b5255" FOREIGN KEY ("offer_id") REFERENCES "request_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_08c5a24b6482391b6dfd90b5255"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "offer_id" TO "request_id"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d64a7332add491c29e75412b627" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
