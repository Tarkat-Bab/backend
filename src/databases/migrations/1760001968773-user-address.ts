import { MigrationInterface, QueryRunner } from "typeorm";

export class UserAddress1760001968773 implements MigrationInterface {
    name = 'UserAddress1760001968773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "ar_address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "en_address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1" FOREIGN KEY ("technical_profile_id") REFERENCES "technical_profiles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "en_address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ar_address"`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1" FOREIGN KEY ("technical_profile_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
