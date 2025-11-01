import { MigrationInterface, QueryRunner } from "typeorm";

export class TabbyPayId1762007756681 implements MigrationInterface {
    name = 'TabbyPayId1762007756681'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "payment_tabby_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_5aca55f075f4536515ebca68f81" UNIQUE ("payment_tabby_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_5aca55f075f4536515ebca68f81"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_tabby_id"`);
    }

}
