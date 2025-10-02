import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

const envFile = path.join(process.cwd(), `.${process.env.NODE_ENV}.env`);
dotenv.config({ path: envFile });
import * as glob from 'glob';
import { SnakeNamingStrategy } from 'src/common/naming-stratigies/snake-naming.strategy';
const files = glob.globSync('src/**/*.entity{.ts,.js}');

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT!),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: files,
  synchronize: false,
  migrationsRun: true,
  logging: true,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  namingStrategy: new SnakeNamingStrategy(),
};



export default new DataSource(config);
