import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './infra/database/prisma/prisma.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { ZodFilter } from './common/filters/zod.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RedisModuleConfig } from './infra/config/redis-module.config';

import { FluxoModule } from './fluxo/fluxo.module';
import { EtapaModule } from './etapa/etapa.module';
import { CondicaoModule } from './condicao/condicao.module';
import { InteracaoModule } from './interacao/interacao.module';
import { UnifiedAuthGuard } from './common/guards/unified-auth.guard';

@Module({
	imports: [
		PrismaModule,
		RedisModule.forRoot(RedisModuleConfig),
		JwtModule.register({
			secret: process.env.MICROSERVICE_TOKEN || 'dev-secret-key',
			signOptions: { expiresIn: '1h' },
		}),
		FluxoModule,
		EtapaModule,
		CondicaoModule,
		InteracaoModule,
	],
	controllers: [AppController],
	providers: [
		// Temporariamente desabilitado para testes
		{
			provide: APP_GUARD,
			useClass: UnifiedAuthGuard,
		},
		{
			provide: APP_FILTER,
			useClass: ZodFilter,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor,
		},
	],
})
export class AppModule {}
