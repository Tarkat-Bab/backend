import { MigrationInterface, QueryRunner } from "typeorm";

export class Settings1763168108531 implements MigrationInterface {
    name = 'Settings1763168108531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "device_versions" ("id" SERIAL NOT NULL, "meta" jsonb, "android" jsonb, "ios" jsonb, CONSTRAINT "PK_31e77b08557c6be974b50d41b52" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "client_max_discount" numeric(5,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "technician_max_discount" numeric(5,2) DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "technician_max_discount"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "client_max_discount"`);
        await queryRunner.query(`DROP TABLE "device_versions"`);
    }

}
