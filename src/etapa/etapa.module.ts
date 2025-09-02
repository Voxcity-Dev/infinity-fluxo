import { Module } from '@nestjs/common';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [EtapaController],
	providers: [EtapaService],
	exports: [EtapaService],
})
export class EtapaModule {}
