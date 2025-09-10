import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { EnvironmentValidator } from './infra/config/env';
import { AppModule } from './app.module';
import { RateLimitGuard } from './common/middlewares/rate-limit.guard';
import helmet from 'helmet';
import gracefulShutdown from 'http-graceful-shutdown';
import { z } from 'zod';

process.loadEnvFile();
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


	const config = new DocumentBuilder()
		.setTitle('Infinity Dialog')
		.setDescription('Documentação da API Dialog do Infinity')
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
