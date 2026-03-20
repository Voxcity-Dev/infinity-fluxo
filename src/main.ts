process.loadEnvFile();

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
	const productionOrigins = process.env.CORS_ORIGIN
		? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
		: [
			'https://www.voxcity.com.br',
			'https://infinity.voxcity.com.br',
			'https://infinity-teste.voxcity.com.br',
			'https://infinity-vox.voxcity.com.br',
		];

	app.use(helmet());
	app.enableCors({
		origin: isDevelopment ? true : productionOrigins,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Accept',
			'x-origin-name',
			'x-microservice-token',
		],
		credentials: true,
	});

	app.useGlobalGuards(new RateLimitGuard());

	const config = new DocumentBuilder()
		.setTitle('Infinity Fluxo')
		.setDescription('Documentação da API Fluxo do Infinity')
		.setVersion('1.0')
		.addApiKey({
			type: 'apiKey',
			in: 'header',
			name: 'x-microservice-token',
			description: 'Token do microserviço',
		})
		.build();

	const document = SwaggerModule.createDocument(app, config, { deepScanRoutes: true });
	SwaggerModule.setup('/', app, document);

	await app.listen(process.env.PORT ?? 3000);

	gracefulShutdown(app.getHttpServer());

	logger.log(`🚀 Aplicação iniciada com sucesso!`, new Date().toISOString());
}
void bootstrap();
