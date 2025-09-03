import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateTransacaoInput } from './dto/create-transacao.dto';

@Injectable()
export class TransacaoService {
	constructor(private readonly prisma: PrismaService) {}

	// Exemplo de método comentado
	/*
	async create(data: CreateTransacaoInput) {
		try {
			const transacao = await this.prisma.transacao.create({
				data: {
					tenant_id: data.tenant_id,
					etapa_id: data.etapa_id,
				},
			});

			return transacao;
		} catch (error) {
			console.error('Erro ao criar transação:', error);
			throw new BadRequestException('Erro ao criar transação');
		}
	}
	*/
}