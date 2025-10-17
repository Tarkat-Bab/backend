import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestsOfferAccepted1760702845845 implements MigrationInterface {
    name = 'RequestsOfferAccepted1760702845845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_offers" ADD "accepted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_offers" DROP COLUMN "accepted"`);
    }

}
