import { Module } from '@nestjs/common';
import { FluxoController } from './fluxo.controller';
import { FluxoService } from './fluxo.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { EtapaService } from 'src/etapa/etapa.service';

@Module({
	imports: [PrismaModule],
	controllers: [FluxoController],
	providers: [FluxoService, EtapaService],
	exports: [FluxoService],
})
export class FluxoModule {}
