import { MigrationInterface, QueryRunner } from "typeorm";

export class TechReviews1761396007563 implements MigrationInterface {
    name = 'TechReviews1761396007563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "rate" integer NOT NULL, "comment" text, "user_id" integer, "technician_id" integer, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_e4f847330bb3d2fa17888e10564" FOREIGN KEY ("technician_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_e4f847330bb3d2fa17888e10564"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
