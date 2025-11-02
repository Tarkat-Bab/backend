import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications1761748903779 implements MigrationInterface {
    name = 'Notifications1761748903779'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "ar_title" character varying NOT NULL, "en_title" character varying NOT NULL, "ar_body" character varying NOT NULL, "en_body" character varying NOT NULL, "receiver_types" character varying NOT NULL DEFAULT 'individual', CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users_notifications" ("id" SERIAL NOT NULL, "receiver_id" integer, "notification_id" integer, CONSTRAINT "PK_e2f7e4c458e3bc2bf04fc057863" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users_notifications" ADD CONSTRAINT "FK_c542231059b44ce5c32d1614c3e" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_notifications" ADD CONSTRAINT "FK_3f44bbb38322f2c9307be40ea69" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_notifications" DROP CONSTRAINT "FK_3f44bbb38322f2c9307be40ea69"`);
        await queryRunner.query(`ALTER TABLE "users_notifications" DROP CONSTRAINT "FK_c542231059b44ce5c32d1614c3e"`);
        await queryRunner.query(`DROP TABLE "users_notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
