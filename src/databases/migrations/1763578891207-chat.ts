import { MigrationInterface, QueryRunner } from "typeorm";

export class Chat1763578891207 implements MigrationInterface {
    name = 'Chat1763578891207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "is_admin" boolean NOT NULL DEFAULT false, "last_seen_at" TIMESTAMP, "conversation_id" integer, "user_id" integer, CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_type_enum" AS ENUM('CLIENT_ADMIN', 'TECHNICIAN_ADMIN', 'CLIENT_TECHNICIAN')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "type" "public"."conversations_type_enum" NOT NULL, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_type_enum" AS ENUM('TEXT', 'FILE', 'IMAGE')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" integer, "type" "public"."messages_type_enum" NOT NULL DEFAULT 'TEXT', "content" text, "is_read" boolean NOT NULL DEFAULT false, "conversation_id" integer, "sender_id" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_1559e8a16b828f2e836a2312800" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_377d4041a495b81ee1a85ae026f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_377d4041a495b81ee1a85ae026f"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_1559e8a16b828f2e836a2312800"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "is_read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
    }

}
