import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportReplies1761303347453 implements MigrationInterface {
    name = 'ReportReplies1761303347453'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reports_replies" (
            "id" SERIAL NOT NULL, 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "deleted" boolean NOT NULL DEFAULT false, 
            "deleted_at" TIMESTAMP, 
            "deleted_by" integer,
            "content" text NOT NULL,
            "report_id" integer NOT NULL,
            CONSTRAINT "PK_c9da2a9ddb0021bc102a13b0a88" PRIMARY KEY ("id"),
            CONSTRAINT "FK_reports_replies_report" FOREIGN KEY ("report_id") 
                REFERENCES "reports"("id") ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reports_replies"`);
    }
}
