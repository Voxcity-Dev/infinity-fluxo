import { Logger, Module } from '@nestjs/common';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [SlaController],
	providers: [SlaService, Logger],
	exports: [SlaService],
})
export class SlaModule {}

