import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestsOfferTechnician1760703002204 implements MigrationInterface {
    name = 'RequestsOfferTechnician1760703002204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1️⃣ حذف أي سجلات غير متوافقة
        await queryRunner.query(`
            DELETE FROM "request_offers"
            WHERE "technical_id" IS NOT NULL
              AND "technical_id" NOT IN (SELECT "id" FROM "technical_profiles")
        `);

        await queryRunner.query(`
            ALTER TABLE "request_offers" 
            DROP CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf"
        `);

        await queryRunner.query(`
            ALTER TABLE "request_offers" 
            ADD CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf" 
            FOREIGN KEY ("technical_id") REFERENCES "technical_profiles"("id") 
            ON DELETE RESTRICT 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "request_offers" 
            DROP CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf"
        `);

        await queryRunner.query(`
            ALTER TABLE "request_offers" 
            ADD CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf" 
            FOREIGN KEY ("technical_id") REFERENCES "users"("id") 
            ON DELETE RESTRICT 
            ON UPDATE NO ACTION
        `);
    }
}
