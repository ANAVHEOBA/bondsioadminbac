import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', 'tramway.proxy.rlwy.net'),
  port: configService.get('DB_PORT', 18418),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', 'xAcfRGcygedclogQmKgQdSyDteaeRPgc'),
  database: configService.get('DB_DATABASE', 'railway'),
  synchronize: false,
  logging: true,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  subscribers: ['dist/subscriber/**/*.js'],
});