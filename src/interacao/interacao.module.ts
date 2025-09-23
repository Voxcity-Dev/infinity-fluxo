import { Module } from '@nestjs/common';
import { InteracaoController } from './interacao.controller';
import { InteracaoService } from './interacao.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { MicroserviceTokenModule } from 'src/common/guards/microservice-token.module';

@Module({
	imports: [PrismaModule, MicroserviceTokenModule],
	controllers: [InteracaoController],
	providers: [InteracaoService],
	exports: [InteracaoService],
})
export class InteracaoModule {}
