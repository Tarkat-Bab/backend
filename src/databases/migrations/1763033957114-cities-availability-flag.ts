import { MigrationInterface, QueryRunner } from "typeorm";

export class CitiesAvailabilityFlag1763033957114 implements MigrationInterface {
    name = 'CitiesAvailabilityFlag1763033957114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cities" ADD "available" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cities" DROP COLUMN "available"`);
    }

}
