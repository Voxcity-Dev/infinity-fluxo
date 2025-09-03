import { Module } from '@nestjs/common';
import { FluxoController } from './fluxo.controller';
import { FluxoService } from './fluxo.service';
import { FluxoEngine } from './engines/fluxo.engine';
import { FluxoProcessorService } from './services/fluxo-processor.service';
import { FluxoValidatorService } from './services/fluxo-validator.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [FluxoController],
	providers: [FluxoService, FluxoEngine, FluxoProcessorService, FluxoValidatorService],
	exports: [FluxoService, FluxoEngine, FluxoProcessorService, FluxoValidatorService],
})
export class FluxoModule {}
