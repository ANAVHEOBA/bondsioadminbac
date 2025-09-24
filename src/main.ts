// Update src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger documentation with better auth config
  const config = new DocumentBuilder()
    .setTitle('BondsIO Admin API')
    .setDescription('Admin panel API for BondsIO')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Custom Swagger options
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true, // This helps persist auth between refreshes
      authAction: {
        JWTAuth: {
          name: 'JWTAuth',
          schema: {
            type: 'http',
            in: 'header',
            name: 'Authorization',
            description: 'Enter JWT token',
          },
          value: 'Bearer <JWT token>',
        },
      },
    },
  };
  
  SwaggerModule.setup('api/docs', app, document, swaggerOptions);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Admin API running on port ${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();