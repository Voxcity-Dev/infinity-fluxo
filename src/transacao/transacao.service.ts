import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateTransacaoInput } from './dto/create-transacao.dto';

@Injectable()
export class TransacaoService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(tenant_id: string, page: number = 1, limit: number = 10) {
		try {
			const transacoes = await this.prisma.transacao.findMany({
				where: {
					tenant_id,
					is_deleted: false,
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			const total = await this.prisma.transacao.count({
				where: {
					tenant_id,
					is_deleted: false,
				},
			});

			return {
				data: transacoes,
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error('Erro ao listar transações:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar transações');
		}
	}

	async findById(id: string) {
		try {
			const transacao = await this.prisma.transacao.findUnique({
				where: { 
					id,
					is_deleted: false // Garantir que não retorne transações deletadas
				},
			});

			if (!transacao) {
				throw new NotFoundException('Transação não encontrada');
			}

			return transacao;
		} catch (error) {
			console.error('Erro ao buscar transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar transação');
		}
	}

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

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao criar transação');
		}
	}

	async update(data: { id: string; etapa_id?: string }) {
		try {
			const { id, etapa_id } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};
			
			if (etapa_id !== undefined && etapa_id !== null && etapa_id !== '') {
				updateData.etapa_id = etapa_id;
			}

			// Verificar se há pelo menos um campo para atualizar
			if (Object.keys(updateData).length === 0) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			const transacao = await this.prisma.transacao.update({
				where: { 
					id,
					is_deleted: false // Garantir que não atualize transações deletadas
				},
				data: updateData,
			});

			return transacao;
		} catch (error) {
			console.error('Erro ao atualizar transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao atualizar transação');
		}
	}

	async delete(id: string) {
		try {
			await this.prisma.transacao.update({
				where: { id },
				data: { is_deleted: true },
			});
			return id;
		} catch (error) {
			console.error('Erro ao deletar transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao deletar transação');
		}
	}
}