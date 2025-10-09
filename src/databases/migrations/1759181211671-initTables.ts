import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1759181211671 implements MigrationInterface {
    name = 'InitTables1759181211671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "technical_profiles" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "description" text, "work_license_image" text, "identity_image" text, "nationality" character varying, "avg_rating" double precision NOT NULL DEFAULT '0', "service_provided" text, CONSTRAINT "PK_3b01326b5cbf211078ff3bbddee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('user', 'admin', 'technical')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "username" character varying(50) NOT NULL, "phone" character varying(20), "email" character varying(100) NOT NULL, "status" character varying NOT NULL DEFAULT 'unverified', "type" "public"."users_type_enum", "image" text, "password" character varying(255), "last_login_at" TIMESTAMP NOT NULL DEFAULT now(), "latitude" double precision, "longitude" double precision, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "nationalities" ("id" SERIAL NOT NULL, "ar_name" character varying NOT NULL, "en_name" character varying NOT NULL, CONSTRAINT "UQ_4a32e687c39f4db5b72b640f14a" UNIQUE ("ar_name"), CONSTRAINT "UQ_cfeb3d2dd9ff369a6891be496e2" UNIQUE ("en_name"), CONSTRAINT "PK_aaa94322d4f245f4fa3c3d591fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "ar_name" character varying NOT NULL, "en_name" character varying NOT NULL, "icone" text, CONSTRAINT "UQ_c4376df28b0c3f84257b2b2eb5b" UNIQUE ("ar_name"), CONSTRAINT "UQ_1f85822a18f00ca73e099cc42d9" UNIQUE ("en_name"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "nationalities"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
        await queryRunner.query(`DROP TABLE "technical_profiles"`);
    }

}
