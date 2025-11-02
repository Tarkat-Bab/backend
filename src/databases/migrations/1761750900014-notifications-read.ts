import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationsRead1761750900014 implements MigrationInterface {
    name = 'NotificationsRead1761750900014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_notifications" ADD "is_read" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_notifications" DROP COLUMN "is_read"`);
   }

}
