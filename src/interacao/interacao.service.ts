import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateInteracaoInput } from './dto/create-interacao.dto';

@Injectable()
export class InteracaoService {
	constructor(private readonly prisma: PrismaService) {}

	// Exemplo de método comentado
	/*
	async create(data: CreateInteracaoInput) {
		try {
			const interacao = await this.prisma.interacoes.create({
				data: {
					tenant_id: data.tenant_id,
					tipo: data.tipo,
					conteudo: data.conteudo,
					url_midia: data.url_midia,
					metadados: data.metadados,
				},
			});

			return interacao;
		} catch (error) {
			console.error('Erro ao criar interação:', error);
			throw new BadRequestException('Erro ao criar interação');
		}
	}
	*/
}