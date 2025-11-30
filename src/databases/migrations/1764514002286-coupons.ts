import { MigrationInterface, QueryRunner } from "typeorm";

export class Coupons1764514002286 implements MigrationInterface {
    name = 'Coupons1764514002286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "coupons" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "max_discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "start_date" date NOT NULL, "end_date" date NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "coupons"`);
    }

}
