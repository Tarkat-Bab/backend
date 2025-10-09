import { MigrationInterface, QueryRunner } from "typeorm";

export class UserTokens1759258965528 implements MigrationInterface {
    name = 'UserTokens1759258965528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_fcm_tokens" ("id" SERIAL NOT NULL, "fcm_token" text NOT NULL, "user_id" integer, CONSTRAINT "PK_f8088ed7e1116e01a4033b6ca76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f"`);
        await queryRunner.query(`DROP TABLE "user_fcm_tokens"`);
    }

}
