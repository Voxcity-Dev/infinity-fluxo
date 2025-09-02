import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { CreateTransacaoInput } from './dto/create-transacao.dto';
import type { UpdateTransacaoInput } from './dto/update-transacao.dto';
import type { ListTransacoesInput } from './dto/list-transacao.dto';
import type { CreateTransacaoRegraInput } from './dto/create-transacao-regra.dto';
import type { UpdateTransacaoRegraInput } from './dto/update-transacao-regra.dto';

@Injectable()
export class TransacaoService {
	constructor(private readonly prisma: PrismaService) {}

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

	async findAll(params: ListTransacoesInput) {
		const { tenant_id, etapa_id, page, limit } = params;
		const skip = (page - 1) * limit;

		const where = {
			tenant_id,
			...(etapa_id && { etapa_id }),
		};

		const [transacoes, total] = await Promise.all([
			this.prisma.transacao.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
			}),
			this.prisma.transacao.count({ where }),
		]);

		return {
			data: transacoes,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(id: string, tenant_id: string) {
		const transacao = await this.prisma.transacao.findFirst({
			where: {
				id,
				tenant_id,
			},
			include: {
				regras: {
					orderBy: { priority: 'asc' },
				},
			},
		});

		if (!transacao) {
			throw new NotFoundException('Transação não encontrada');
		}

		return transacao;
	}

	async update(id: string, tenant_id: string, data: UpdateTransacaoInput) {
		try {
			const transacao = await this.prisma.transacao.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return transacao;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Transação não encontrada');
			}

			console.error('Erro ao atualizar transação:', error);
			throw new BadRequestException('Erro ao atualizar transação');
		}
	}

	async remove(id: string, tenant_id: string) {
		try {
			await this.prisma.transacao.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Transação removida com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Transação não encontrada');
			}

			console.error('Erro ao remover transação:', error);
			throw new BadRequestException('Erro ao remover transação');
		}
	}

	// Métodos para regras de transação
	async createRegra(data: CreateTransacaoRegraInput) {
		try {
			const regra = await this.prisma.transacaoRegra.create({
				data: {
					transacao_id: data.transacao_id,
					tenant_id: data.tenant_id,
					input: data.input,
					action: data.action,
					next_etapa_id: data.next_etapa_id,
					next_fluxo_id: data.next_fluxo_id,
					queue_id: data.queue_id,
					user_id: data.user_id,
					variable_name: data.variable_name,
					variable_value: data.variable_value,
					api_endpoint: data.api_endpoint,
					db_query: data.db_query,
					priority: data.priority,
				},
			});

			return regra;
		} catch (error) {
			console.error('Erro ao criar regra de transação:', error);
			throw new BadRequestException('Erro ao criar regra de transação');
		}
	}

	async findAllRegras(transacao_id: string, tenant_id: string) {
		const regras = await this.prisma.transacaoRegra.findMany({
			where: {
				transacao_id,
				tenant_id,
			},
			orderBy: { priority: 'asc' },
		});

		return regras;
	}

	async findOneRegra(id: string, tenant_id: string) {
		const regra = await this.prisma.transacaoRegra.findFirst({
			where: {
				id,
				tenant_id,
			},
		});

		if (!regra) {
			throw new NotFoundException('Regra de transação não encontrada');
		}

		return regra;
	}

	async updateRegra(id: string, tenant_id: string, data: UpdateTransacaoRegraInput) {
		try {
			const regra = await this.prisma.transacaoRegra.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return regra;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Regra de transação não encontrada');
			}

			console.error('Erro ao atualizar regra de transação:', error);
			throw new BadRequestException('Erro ao atualizar regra de transação');
		}
	}

	async removeRegra(id: string, tenant_id: string) {
		try {
			await this.prisma.transacaoRegra.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Regra de transação removida com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Regra de transação não encontrada');
			}

			console.error('Erro ao remover regra de transação:', error);
			throw new BadRequestException('Erro ao remover regra de transação');
		}
	}
}
