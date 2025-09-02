import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { CreateInteracaoInput } from './dto/create-interacao.dto';
import type { UpdateInteracaoInput } from './dto/update-interacao.dto';
import type { ListInteracoesInput } from './dto/list-interacao.dto';
import type { InteracaoTipo } from '@prisma/client';

@Injectable()
export class InteracaoService {
	constructor(private readonly prisma: PrismaService) {}

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

	async findAll(params: ListInteracoesInput) {
		const { tenant_id, page, limit, search, tipo } = params;
		const skip = (page - 1) * limit;

		const where = {
			tenant_id,
			...(search && {
				conteudo: {
					contains: search,
					mode: 'insensitive' as const,
				},
			}),
			...(tipo && { tipo: tipo as InteracaoTipo }),
		};

		const [interacoes, total] = await Promise.all([
			this.prisma.interacoes.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
			}),
			this.prisma.interacoes.count({ where }),
		]);

		return {
			data: interacoes,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(id: string, tenant_id: string) {
		const interacao = await this.prisma.interacoes.findFirst({
			where: {
				id,
				tenant_id,
			},
		});

		if (!interacao) {
			throw new NotFoundException('Interação não encontrada');
		}

		return interacao;
	}

	async update(id: string, tenant_id: string, data: UpdateInteracaoInput) {
		try {
			const interacao = await this.prisma.interacoes.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return interacao;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Interação não encontrada');
			}

			console.error('Erro ao atualizar interação:', error);
			throw new BadRequestException('Erro ao atualizar interação');
		}
	}

	async remove(id: string, tenant_id: string) {
		try {
			await this.prisma.interacoes.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Interação removida com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Interação não encontrada');
			}

			console.error('Erro ao remover interação:', error);
			throw new BadRequestException('Erro ao remover interação');
		}
	}
}
