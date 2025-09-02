import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { EnvironmentValidator } from './infra/config/env';
import { AppModule } from './app.module';
import { RateLimitGuard } from './common/middlewares/rate-limit.guard';
import helmet from 'helmet';
import gracefulShutdown from 'http-graceful-shutdown';
import { z } from 'zod';

z.config(z.locales.pt());

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	EnvironmentValidator.validate();

	const app = await NestFactory.create(AppModule);

	const isDevelopment = process.env.NODE_ENV === 'development';

	app.use(helmet());
	app.enableCors({
		origin: isDevelopment ? true : ['https://www.voxcity.com.br/'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		credentials: true,
	});

	app.useGlobalGuards(new RateLimitGuard());

	app.setGlobalPrefix('api/v1');

	const config = new DocumentBuilder()
		.setTitle('Infinity Mensageria')
		.setDescription('Documentação da API Mensageria do Infinity')
		.setVersion('1.0')
		.addBearerAuth(
			{
				description: `Por favor, insira o token JWT desta forma: Bearer <JWT>`,
				name: 'Authorization',
				bearerFormat: 'JWT',
				scheme: 'bearer',
				type: 'http',
				in: 'Header',
			},
			'access-token',
		)
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('/', app, document);

	await app.listen(process.env.PORT ?? 3000);

	gracefulShutdown(app.getHttpServer());

	logger.log(`🚀 Aplicação iniciada com sucesso!`, new Date().toISOString());
}
void bootstrap();
