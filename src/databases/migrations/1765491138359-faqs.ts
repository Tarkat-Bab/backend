import { MigrationInterface, QueryRunner } from "typeorm";

export class Faqs1765491138359 implements MigrationInterface {
    name = 'Faqs1765491138359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "faqs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" integer, "question_ar" character varying(500) NOT NULL, "question_en" character varying(500) NOT NULL, "answer_ar" text NOT NULL, "answer_en" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "faqs"`);
    }

}
