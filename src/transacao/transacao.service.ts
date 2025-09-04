import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateTransacaoInput } from './dto/create-transacao.dto';
import { ListTransacoesInput } from './dto/list-transacao.dto';
import { CreateTransacaoRegraInput } from './dto/create-transacao-regra.dto';
import { TransacaoRegra } from 'src/schemas/transacao.schema';
import { UpdateTransacaoRegraInput } from './dto/update-transacao-regra.dto';

@Injectable()
export class TransacaoService {
	constructor(private readonly prisma: PrismaService) {}

	async find(params: ListTransacoesInput) {
		try {
			const { page, limit, tenant_id, etapa_id } = params;

			const transacoes = await this.prisma.transacao.findMany({
				where: {
					tenant_id,
					etapa_id,
					is_deleted: false,
				},
				include: {
					regras: true,
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
					etapa_id,
					is_deleted: false,
				},
			});

			// Mapear as transações para o formato de resposta
			const transacoesMapeadas = transacoes.map(transacao => this.mapperTransacaoToResponse(transacao));

			return {
				data: transacoesMapeadas,
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

	async create(data: CreateTransacaoInput) {
		try {
			const { tenant_id, etapa_id, regras } = data;

			// Usar transação para garantir consistência
			const resultado = await this.prisma.$transaction(async (prisma) => {
				// Criar a transação
				const transacao = await prisma.transacao.create({
					data: {
						tenant_id,
						etapa_id,
					},
				});

				// Mapear e criar as regras usando o mapper centralizado
				const regrasData = regras.map((regra, index) => 
					this.mapperRegraToDatabase(regra, transacao.id, tenant_id, regra.priority || index)
				);

				console.dir(regrasData, { depth: null });

				// Criar todas as regras de uma vez
				await prisma.transacaoRegra.createMany({
					data: regrasData,
					skipDuplicates: true,
				});

				// Retornar a transação com suas regras
				return await prisma.transacao.findUnique({
					where: { id: transacao.id },
					include: {
						regras: {
							where: { is_deleted: false },
							orderBy: { priority: 'asc' }
						}
					}
				});
			});

			return this.mapperTransacaoToResponse(resultado);
		} catch (error) {
			console.error('Erro ao criar transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao criar transação');
		}
	}

	async updateRegras(data: UpdateTransacaoRegraInput) {
		try {
			const { transacao_id, regras } = data;

			const resultado = await this.prisma.$transaction(async (prisma) => {
				// Verificar se a transação existe
				const transacao = await prisma.transacao.findUnique({
					where: { 
						id: transacao_id,
						is_deleted: false 
					}
				});

				if (!transacao) {
					throw new NotFoundException('Transação não encontrada');
				}

				// Se não há regras para processar, retornar transação vazia
				if (!regras || regras.length === 0) {
					return await prisma.transacao.findUnique({
						where: { id: transacao_id },
						include: {
							regras: {
								where: { is_deleted: false },
								orderBy: { priority: 'asc' }
							}
						}
					});
				}

				// Processar cada regra individualmente
				for (const regra of regras) {
					if (regra.id) {
						// REGRA EXISTE: Atualizar apenas input, action e limpar outros campos
						await prisma.transacaoRegra.update({
							where: { 
								id: regra.id,
								transacao_id: transacao_id,
								is_deleted: false
							},
							data: {
								input: regra.input,
								action: regra.action,
								// Limpar todos os campos opcionais
								next_etapa_id: null,
								next_fluxo_id: null,
								queue_id: null,
								user_id: null,
								variable_name: null,
								variable_value: null,
								api_endpoint: null,
								db_query: null,
								priority: regra.priority || 0,
							}
						});
					} else {
						// REGRA NÃO EXISTE: Criar nova regra
						const novaRegra = this.mapperRegraToDatabase(
							regra, 
							transacao_id, 
							transacao.tenant_id, 
							regra.priority || 0
						);

						await prisma.transacaoRegra.create({
							data: novaRegra
						});
					}
				}

				// Retornar a transação com suas regras atualizadas
				return await prisma.transacao.findUnique({
					where: { id: transacao_id },
					include: {
						regras: {
							where: { is_deleted: false },
							orderBy: { priority: 'asc' }
						}
					}
				});
			});

			return this.mapperTransacaoToResponse(resultado);
		} catch (error) {
			console.error('Erro ao atualizar regras da transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar regras da transação');
		}
	}

	async deletar(transacao_id: string) {
		try {
			const transacao = await this.prisma.transacao.update({
				where: { id: transacao_id },
				data: { is_deleted: true }
			});

			return transacao
		} catch (error) {
			console.error('Erro ao deletar transação:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao deletar transação');
		}
	}

	/**
	 * Mapper centralizado para converter regras de entrada em formato do banco
	 * @param regra - Regra de entrada
	 * @param transacao_id - ID da transação
	 * @param tenant_id - ID do tenant
	 * @param priority - Prioridade da regra (opcional)
	 * @returns Objeto formatado para inserção no banco
	 */
	private mapperRegraToDatabase(regra: any, transacao_id: string, tenant_id: string, priority?: number) {
		return {
			transacao_id,
			tenant_id,
			input: regra.input,
			action: regra.action,
			next_etapa_id: regra.next_etapa_id || null,
			next_fluxo_id: regra.next_fluxo_id || null,
			queue_id: regra.queue_id || null,
			user_id: regra.user_id || null,
			variable_name: regra.variable_name || null,
			variable_value: regra.variable_value || null,
			api_endpoint: regra.api_endpoint || null,
			db_query: regra.db_query || null,
			priority: priority || regra.priority || 0,
		};
	}

	/**
	 * Mapper para converter regra do banco para formato de resposta
	 * @param regra - Regra do banco de dados
	 * @returns Regra formatada para resposta
	 */
	private mapperRegraToResponse(regra: any): TransacaoRegra {
		return {
			id: regra.id,
			transacao_id: regra.transacao_id,
			tenant_id: regra.tenant_id,
			input: regra.input,
			action: regra.action,
			next_etapa_id: regra.next_etapa_id,
			next_fluxo_id: regra.next_fluxo_id,
			queue_id: regra.queue_id,
			user_id: regra.user_id,
			variable_name: regra.variable_name,
			variable_value: regra.variable_value,
			api_endpoint: regra.api_endpoint,
			db_query: regra.db_query,
			priority: regra.priority,
			is_deleted: regra.is_deleted,
			created_at: regra.created_at,
			updated_at: regra.updated_at,
		};
	}

	/**
	 * Mapper para converter transação do banco para formato de resposta
	 * @param transacao - Transação do banco de dados
	 * @returns Transação formatada para resposta
	 */
	private mapperTransacaoToResponse(transacao: any) {
		return {
			...transacao,
			regras: transacao.regras ? transacao.regras.map(regra => this.mapperRegraToResponse(regra)) : []
		};
	}
}