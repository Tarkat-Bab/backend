import { MigrationInterface, QueryRunner } from "typeorm";

export class RegionsCities1762874677797 implements MigrationInterface {
    name = 'RegionsCities1762874677797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_e4f847330bb3d2fa17888e10564"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_technical_profiles"`);
        await queryRunner.query(`CREATE TABLE "cities" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "ar_name" character varying(100) NOT NULL, "en_name" character varying(100) NOT NULL, "latitude" double precision, "longitude" double precision, "region_id" integer, CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "regions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "ar_name" character varying(100) NOT NULL, "en_name" character varying(100) NOT NULL, "latitude" double precision, "longitude" double precision, CONSTRAINT "PK_4fcd12ed6a046276e2deb08801c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "is_read"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "latitude" numeric(10,6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "longitude" numeric(10,6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports_replies" DROP CONSTRAINT "FK_83a856d8103d9937a08160ac769"`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ALTER COLUMN "report_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_e4f847330bb3d2fa17888e10564" FOREIGN KEY ("technician_id") REFERENCES "technical_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ADD CONSTRAINT "FK_83a856d8103d9937a08160ac769" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cities" ADD CONSTRAINT "FK_42a294591feef6af3d96d60132a" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cities" DROP CONSTRAINT "FK_42a294591feef6af3d96d60132a"`);
        await queryRunner.query(`ALTER TABLE "reports_replies" DROP CONSTRAINT "FK_83a856d8103d9937a08160ac769"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_e4f847330bb3d2fa17888e10564"`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ALTER COLUMN "report_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reports_replies" ADD CONSTRAINT "FK_83a856d8103d9937a08160ac769" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "longitude" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "latitude" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "is_read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "regions"`);
        await queryRunner.query(`DROP TABLE "cities"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_technical_profiles" FOREIGN KEY ("technician_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_e4f847330bb3d2fa17888e10564" FOREIGN KEY ("technician_id") REFERENCES "technical_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
