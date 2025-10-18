import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportsRequests1760099739520 implements MigrationInterface {
    name = 'ReportsRequests1760099739520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "request_offers" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "price" numeric(10,2) NOT NULL, "needs_delivery" boolean NOT NULL DEFAULT false, "description" text, "latitude" double precision, "longitude" double precision, "ar_address" character varying(255), "en_address" character varying(255), "request_id" integer, "technical_id" integer, CONSTRAINT "PK_29260f2a6150eccbb70844ad9fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "requests_media" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "media" text NOT NULL, "request_id" integer, CONSTRAINT "PK_e92d9eda86513c6dd8537575917" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "service_requests" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "title" character varying NOT NULL, "description" text NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "ar_address" character varying NOT NULL, "en_address" character varying NOT NULL, "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'pending', "price" numeric(10,2) NOT NULL, "request_number" character varying NOT NULL, "user_id" integer, "technician_id" integer, CONSTRAINT "UQ_95492f68d4278a52b383dd12284" UNIQUE ("request_number"), CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reports_media" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "media" text NOT NULL, "report_id" integer, CONSTRAINT "PK_8c9595b0e19aca8b3b06e015a0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reports_reason_enum" AS ENUM('unprofessional_behavior', 'incomplete_service', 'bad_quality_work', 'extra_price_charged', 'other')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "report_number" character varying NOT NULL, "reason" "public"."reports_reason_enum" NOT NULL DEFAULT 'other', "message" text NOT NULL, "user_id" integer, "technician_id" integer, CONSTRAINT "UQ_f5aabd4a57a4ddcb4372d23f449" UNIQUE ("report_number"), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ADD "requests_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "request_offers" ADD CONSTRAINT "FK_d59065d93d15f18bd7b197ba88b" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_offers" ADD CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf" FOREIGN KEY ("technical_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests_media" ADD CONSTRAINT "FK_ccf5db2ef4abc34f2b5e29d5c07" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_c38549a33af09d8cf92e9878a17" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_58f2a97d333d8740ce83c675e41" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_6961087379b5aa08f1ec21ee22c" FOREIGN KEY ("requests_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports_media" ADD CONSTRAINT "FK_1adcd241a7aa8aa115481380c55" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_ca7a21eb95ca4625bd5eaef7e0c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_60c8c9ace443a72b7e84e814ac1" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_60c8c9ace443a72b7e84e814ac1"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_ca7a21eb95ca4625bd5eaef7e0c"`);
        await queryRunner.query(`ALTER TABLE "reports_media" DROP CONSTRAINT "FK_1adcd241a7aa8aa115481380c55"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_6961087379b5aa08f1ec21ee22c"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_58f2a97d333d8740ce83c675e41"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_c38549a33af09d8cf92e9878a17"`);
        await queryRunner.query(`ALTER TABLE "requests_media" DROP CONSTRAINT "FK_ccf5db2ef4abc34f2b5e29d5c07"`);
        await queryRunner.query(`ALTER TABLE "request_offers" DROP CONSTRAINT "FK_6e11e123f327a231d9c5cb9a1cf"`);
        await queryRunner.query(`ALTER TABLE "request_offers" DROP CONSTRAINT "FK_d59065d93d15f18bd7b197ba88b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "requests_id"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_reason_enum"`);
        await queryRunner.query(`DROP TABLE "reports_media"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "requests_media"`);
        await queryRunner.query(`DROP TABLE "request_offers"`);
    }

}
