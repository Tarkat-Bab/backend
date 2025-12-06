import { MigrationInterface, QueryRunner } from "typeorm";

export class CouponsOrder1764524739089 implements MigrationInterface {
    name = 'CouponsOrder1764524739089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "first_order_discount" ("id" SERIAL NOT NULL, "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "max_discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9855f1360651801a5fa83353e58" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "first_order_discount"`);
    }

}
