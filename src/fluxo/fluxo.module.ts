import { Module } from '@nestjs/common';
import { FluxoController } from './fluxo.controller';
import { FluxoService } from './fluxo.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { EtapaModule } from 'src/etapa/etapa.module';
import { CondicaoModule } from 'src/condicao/condicao.module';
import { ConfigService } from 'src/common/services/config.service';
import { MicroserviceTokenModule } from 'src/common/guards/microservice-token.module';

@Module({
	imports: [PrismaModule, EtapaModule, CondicaoModule, MicroserviceTokenModule],
	controllers: [FluxoController],
	providers: [FluxoService, ConfigService],
	exports: [FluxoService],
})
export class FluxoModule {}
