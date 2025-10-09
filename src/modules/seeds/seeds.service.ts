import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { seedData } from '../../databases/seeds/seed-data';

@Injectable()
export class SeedsService {
    constructor(private readonly dataSource: DataSource) {}

    async seedDatabase() {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
           const manager = queryRunner.manager;
           await seedData(manager);
           await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

}
