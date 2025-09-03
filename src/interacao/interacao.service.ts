import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateInteracaoInput } from './dto/create-interacao.dto';
import { ListInteracoesInput } from './dto/list-interacao.dto';
import { UpdateInteracaoInput } from './dto/update-interacao.dto';

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
				where: { tenant_id: params.tenant_id, is_deleted: false },
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

	async create(data: CreateInteracaoInput) {
		try {
			const interacao = await this.prisma.interacoes.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
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

	async update(data: UpdateInteracaoInput) {
		try {
			await this.prisma.interacoes.update({
				where: { id: data.id },
				data: data,
			});
			return data;

		} catch (error) {
			console.error('Erro ao atualizar interação:', error);
			throw new BadRequestException('Erro ao atualizar interação');
		}
	}

	async delete(id: string) {
		try {
			await this.prisma.interacoes.update({
				where: { id: id },
				data: { is_deleted: true },
			});
			return id;
		} catch (error) {
			console.error('Erro ao deletar interação:', error);
			throw new BadRequestException('Erro ao deletar interação');
		}
	}
}