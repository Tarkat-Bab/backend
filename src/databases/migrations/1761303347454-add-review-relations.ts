import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewRelations1761303347454 implements MigrationInterface {
    name = 'AddReviewRelations1761303347454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "technician_id" integer,
            ADD CONSTRAINT "FK_reviews_technical_profiles" 
            FOREIGN KEY ("technician_id") 
            REFERENCES "technical_profiles"("id") 
            ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" 
            DROP CONSTRAINT "FK_reviews_technical_profiles",
            DROP COLUMN "technician_id"`);
    }
}
