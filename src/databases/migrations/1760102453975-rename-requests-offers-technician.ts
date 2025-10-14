import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRequestsOffersTechnician1760102453975 implements MigrationInterface {
    name = 'RenameRequestsOffersTechnician1760102453975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_offers" ALTER COLUMN "description" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_offers" ALTER COLUMN "description" DROP NOT NULL`);
    }

}
