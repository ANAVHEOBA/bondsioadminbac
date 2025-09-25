// src/third-party/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { CustomMailerService } from './mailer.service'; // ✅ Use new name

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
        
        return {
          transport: {
            host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT ?? '587', 10),
            secure: false, // Use TLS
            
            // ✅ Production-ready timeout settings for ZeptoMail
            connectionTimeout: isRailway ? 30000 : (isProduction ? 20000 : 10000), // 30s for Railway
            greetingTimeout: isRailway ? 15000 : (isProduction ? 10000 : 5000), // 15s for Railway  
            socketTimeout: isRailway ? 60000 : (isProduction ? 45000 : 30000), // 60s for Railway
            
            // ✅ Connection pooling for better performance
            pool: true,
            maxConnections: isRailway ? 3 : 5, // Lower for Railway to avoid overwhelming
            maxMessages: isRailway ? 50 : 100, // Lower for Railway
            
            // ✅ Retry logic for connection issues
            maxRetries: isRailway ? 3 : 2,
            retryDelay: isRailway ? 5000 : 2000, // 5s delay between retries on Railway
            
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASSWORD,
            },
            
            tls: {
              rejectUnauthorized: false,
              // ✅ ZeptoMail specific TLS settings
              ciphers: 'TLSv1.2',
              minVersion: 'TLSv1.2',
              maxVersion: 'TLSv1.3'
            },
            
            // ✅ Performance optimizations for production
            logger: false,
            debug: false,
          },
          defaults: {
            from: `"${process.env.MAIL_FROM_NAME ?? 'Bondsio'}" <${process.env.MAIL_FROM_ADDRESS ?? 'noreply@bondsio.com'}>`,
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [CustomMailerService], // ✅ Use new name
  exports: [CustomMailerService],   // ✅ Export new name
})
export class MailerModule {}