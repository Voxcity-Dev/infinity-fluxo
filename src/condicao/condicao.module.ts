import { Module } from '@nestjs/common';
import { CondicaoController } from './condicao.controller';
import { CondicaoService } from './condicao.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { ConfigService } from 'src/common/services/config.service';
import { EtapaService } from 'src/etapa/etapa.service';
import { LogService } from 'src/common/services/log.service';

@Module({
	imports: [PrismaModule],
	controllers: [CondicaoController],
	providers: [CondicaoService, ConfigService, EtapaService, LogService],
	exports: [CondicaoService],
})
export class CondicaoModule {}
