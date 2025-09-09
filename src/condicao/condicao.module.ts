import { Module } from '@nestjs/common';
import { CondicaoController } from './condicao.controller';
import { CondicaoService } from './condicao.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { ConfigService } from 'src/common/services/config.service';
import { EtapaService } from 'src/etapa/etapa.service';

@Module({
	imports: [PrismaModule],
	controllers: [CondicaoController],
	providers: [CondicaoService, ConfigService, EtapaService],
	exports: [CondicaoService],
})
export class CondicaoModule {}
