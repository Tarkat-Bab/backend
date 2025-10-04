import { MigrationInterface, QueryRunner } from "typeorm";

export class TechnicalProfileJoin1759586282374 implements MigrationInterface {
    name = 'TechnicalProfileJoin1759586282374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD CONSTRAINT "UQ_984e99241db20b5dbdcd767d9be" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD CONSTRAINT "FK_984e99241db20b5dbdcd767d9be" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP CONSTRAINT "FK_984e99241db20b5dbdcd767d9be"`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP CONSTRAINT "UQ_984e99241db20b5dbdcd767d9be"`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "user_id"`);
    }

}
