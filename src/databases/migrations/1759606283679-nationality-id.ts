import { MigrationInterface, QueryRunner } from "typeorm";

export class NationalityId1759606283679 implements MigrationInterface {
    name = 'NationalityId1759606283679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "service_provided"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "technical_profile_id" integer`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "nationality_id" integer`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1" FOREIGN KEY ("technical_profile_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD CONSTRAINT "FK_8f91539cb44754117cc9384600d" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP CONSTRAINT "FK_8f91539cb44754117cc9384600d"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_b8c1d50246ddbdad13eb4707ad1"`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" DROP COLUMN "nationality_id"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "technical_profile_id"`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "service_provided" text`);
        await queryRunner.query(`ALTER TABLE "technical_profiles" ADD "nationality" character varying`);
    }

}
