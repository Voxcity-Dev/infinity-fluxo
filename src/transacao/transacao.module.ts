import { Module } from '@nestjs/common';
import { TransacaoController } from './transacao.controller';
import { TransacaoService } from './transacao.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [TransacaoController],
	providers: [TransacaoService],
	exports: [TransacaoService],
})
export class TransacaoModule {}
