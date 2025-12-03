import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTimestampColumns1764771340126 implements MigrationInterface {
    name = 'UpdateTimestampColumns1764771340126'

    private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = '${table}' 
                AND column_name = '${column}'
            );
        `);
        return result[0].exists;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update all timestamp columns to timestamptz for proper timezone handling
        const tables = [
            'request_offers', 'requests_media', 'service_requests', 'services', 
            'reviews', 'technical_profiles', 'reports_media', 'reports_replies', 
            'reports', 'notifications', 'users', 'cities', 'regions', 
            'conversation_participants', 'conversations', 'messages',
            'payments', 'user_fcm_tokens', 'users_notifications', 'first_order_discount',
            'coupons', 'settings', 'device_versions', 'nationalities'
        ];

        for (const table of tables) {
            // Update created_at if exists
            if (await this.columnExists(queryRunner, table, 'created_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
                    USING "created_at" AT TIME ZONE 'UTC'
                `);
            }
            
            // Update updated_at if exists
            if (await this.columnExists(queryRunner, table, 'updated_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
                    USING "updated_at" AT TIME ZONE 'UTC'
                `);
            }
            
            // Update deleted_at if exists (nullable)
            if (await this.columnExists(queryRunner, table, 'deleted_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "deleted_at" TYPE TIMESTAMP WITH TIME ZONE 
                    USING "deleted_at" AT TIME ZONE 'UTC'
                `);
            }
        }
        
        // Update conversation_participants last_seen_at if exists
        if (await this.columnExists(queryRunner, 'conversation_participants', 'last_seen_at')) {
            await queryRunner.query(`
                ALTER TABLE "conversation_participants" 
                ALTER COLUMN "last_seen_at" TYPE TIMESTAMP WITH TIME ZONE 
                USING "last_seen_at" AT TIME ZONE 'UTC'
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert all timestamp columns back to timestamp without timezone
        const tables = [
            'request_offers', 'requests_media', 'service_requests', 'services', 
            'reviews', 'technical_profiles', 'reports_media', 'reports_replies', 
            'reports', 'notifications', 'users', 'cities', 'regions', 
            'conversation_participants', 'conversations', 'messages',
            'payments', 'user_fcm_tokens', 'users_notifications', 'first_order_discount',
            'coupons', 'settings', 'device_versions', 'nationalities'
        ];

        for (const table of tables) {
            if (await this.columnExists(queryRunner, table, 'created_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "created_at" TYPE TIMESTAMP
                `);
            }
            
            if (await this.columnExists(queryRunner, table, 'updated_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "updated_at" TYPE TIMESTAMP
                `);
            }
            
            if (await this.columnExists(queryRunner, table, 'deleted_at')) {
                await queryRunner.query(`
                    ALTER TABLE "${table}" 
                    ALTER COLUMN "deleted_at" TYPE TIMESTAMP
                `);
            }
        }
        
        if (await this.columnExists(queryRunner, 'conversation_participants', 'last_seen_at')) {
            await queryRunner.query(`
                ALTER TABLE "conversation_participants" 
                ALTER COLUMN "last_seen_at" TYPE TIMESTAMP
            `);
        }
    }
}
