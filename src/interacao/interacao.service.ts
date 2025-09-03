import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateInteracaoInput } from './dto/create-interacao.dto';
import { ListInteracoesInput } from './dto/list-interacao.dto';

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

	async findAll(params: ListInteracoesInput) {
		try {
			const { page, limit, search, tenant_id, tipo } = params;

			const interacoes = await this.prisma.interacoes.findMany({
				where: { tenant_id: params.tenant_id },
				orderBy: { created_at: 'asc' },
				skip: (page - 1) * limit,
				take: limit,
			});

			return interacoes;
		} catch (error) {
			console.error('Erro ao listar interações:', error);
			throw new BadRequestException('Erro ao listar interações');
		}
	}
}