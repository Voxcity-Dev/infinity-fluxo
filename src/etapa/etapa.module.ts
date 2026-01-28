import { Module } from '@nestjs/common';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';
import { ApiStepExecutor } from './executors/api-step.executor';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
@Module({
	imports: [PrismaModule],
	controllers: [EtapaController],
	providers: [EtapaService, ApiStepExecutor],
	exports: [EtapaService, ApiStepExecutor],
})
export class EtapaModule {}
