import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'tramway.proxy.rlwy.net',
        port: parseInt(process.env.DB_PORT || '18418'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'xAcfRGcygedclogQmKgQdSyDteaeRPgc',
        database: process.env.DB_DATABASE || 'railway',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    AdminModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}