import { MigrationInterface, QueryRunner } from "typeorm";

export class ImageIds1761162328555 implements MigrationInterface {
    name = 'ImageIds1761162328555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_ca7a21eb95ca4625bd5eaef7e0c"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_60c8c9ace443a72b7e84e814ac1"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "technician_id"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "reporter_id" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "reported_id" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_a4f4f08ca7392c630494d1a77f7" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_a4f4f08ca7392c630494d1a77f7"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "reported_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "reporter_id"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "technician_id" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_60c8c9ace443a72b7e84e814ac1" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_ca7a21eb95ca4625bd5eaef7e0c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
