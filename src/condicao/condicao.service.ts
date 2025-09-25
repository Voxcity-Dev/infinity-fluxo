import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateCondicaoInput } from './dto/create-condicao.dto';
import { ListCondicoesInput } from './dto/list-condicao.dto';
import { CondicaoRegra } from 'src/schemas/condicao.schema';
import { UpdateCondicaoRegraInput } from './dto/update-condicao-regra.dto';
import { ConfigService } from 'src/common/services/config.service';
import { EtapaService } from 'src/etapa/etapa.service';
import { LogService } from 'src/common/services/log.service';
import { CreateLog } from 'src/schemas';

@Injectable()
export class CondicaoService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
		private readonly etapaService: EtapaService,
		private readonly logService: LogService,
	) {}

	async find(params: ListCondicoesInput) {
		try {
			const { page, limit, tenant_id, etapa_id } = params;

			// Construir objeto de query base
			const queryOptions: any = {
				where: {
					tenant_id,
					etapa_id,
					is_deleted: false,
				},
				include: {
					regras: {
						where: { is_deleted: false },
						orderBy: { priority: 'asc' },
					},
				},
				orderBy: {
					created_at: 'desc',
				},
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const condicoes = await this.prisma.condicao.findMany(queryOptions);

			const total = await this.prisma.condicao.count({
				where: {
					tenant_id,
					etapa_id,
					is_deleted: false,
				},
			});

			// Mapear as condições para o formato de resposta
			const condicoesMapeadas = condicoes.map(condicao => this.mapperCondicaoToResponse(condicao));

			return {
				data: condicoesMapeadas,
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error('Erro ao listar condições:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao listar condições');
		}
	}

	async create(data: CreateCondicaoInput) {
		try {
			const { tenant_id, etapa_id, regras } = data;

			// Usar condição para garantir consistência
			const resultado = await this.prisma.$transaction(async prisma => {
				// Criar a condição
				const condicao = await prisma.condicao.create({
					data: {
						tenant_id,
						etapa_id,
					},
				});

				// Mapear e criar as regras usando o mapper centralizado
				const regrasData = regras.map((regra, index) =>
					this.mapperRegraToDatabase(regra, condicao.id, tenant_id, regra.priority || index),
				);

				console.dir(regrasData, { depth: null });

				// Criar todas as regras de uma vez
				await prisma.condicaoRegra.createMany({
					data: regrasData,
					skipDuplicates: true,
				});

				// Retornar a condição com suas regras
				return await prisma.condicao.findUnique({
					where: { id: condicao.id },
					include: {
						regras: {
							where: { is_deleted: false },
							orderBy: { priority: 'asc' },
						},
					},
				});
			});

			return this.mapperCondicaoToResponse(resultado);
		} catch (error) {
			console.error('Erro ao criar condição:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao criar condição');
		}
	}

	async updateRegras(data: UpdateCondicaoRegraInput) {
		try {
			const { condicao_id, regras } = data;

			const resultado = await this.prisma.$transaction(async prisma => {
				// Verificar se a condição existe
				const condicao = await prisma.condicao.findUnique({
					where: {
						id: condicao_id,
						is_deleted: false,
					},
				});

				if (!condicao) {
					throw new NotFoundException('Condição não encontrada');
				}

				// Se não há regras para processar, retornar condição vazia
				if (!regras || regras.length === 0) {
					return await prisma.condicao.findUnique({
						where: { id: condicao_id },
						include: {
							regras: {
								where: { is_deleted: false },
								orderBy: { priority: 'asc' },
							},
						},
					});
				}

				// Processar cada regra individualmente
				for (const regra of regras) {
					if (regra.id) {
						// REGRA EXISTE: Atualizar apenas input, action e limpar outros campos
						await prisma.condicaoRegra.update({
							where: {
								id: regra.id,
								condicao_id,
								is_deleted: false,
							},
							data: {
								input: regra.input || undefined,
								action: regra.action,
								msg_exata: regra.msg_exata || false,
								next_etapa_id: regra.next_etapa_id || undefined,
								next_fluxo_id: regra.next_fluxo_id || undefined,
								queue_id: regra.queue_id || undefined,
								user_id: regra.user_id || undefined,
								variable_name: regra.variable_name || undefined,
								variable_value: regra.variable_value || undefined,
								api_endpoint: regra.api_endpoint || undefined,
								db_query: regra.db_query || undefined,
								priority: regra.priority || 0,
							},
						});
					} else {
						// REGRA NÃO EXISTE: Criar nova regra
						const novaRegra = this.mapperRegraToDatabase(
							regra,
							condicao_id,
							condicao.tenant_id,
							regra.priority || 0,
						);

						await prisma.condicaoRegra.create({
							data: novaRegra,
						});
					}
				}

				// Retornar a condição com suas regras atualizadas
				return await prisma.condicao.findUnique({
					where: { id: condicao_id },
					include: {
						regras: {
							where: { is_deleted: false },
							orderBy: { priority: 'asc' },
						},
					},
				});
			});

			return this.mapperCondicaoToResponse(resultado);
		} catch (error) {
			console.error('Erro ao atualizar regras da condição:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar regras da condição');
		}
	}

	async deletar(regra_id: string) {
		try {
			const regra = await this.prisma.$transaction(async prisma => {
				// 1. Deletar a regra
				await prisma.condicaoRegra.update({
					where: { 
						id: regra_id,
						is_deleted: false 
					},
					data: { is_deleted: true }
				});

				return await prisma.condicaoRegra.findUnique({
					where: { id: regra_id },
				});
			});

			return regra;
		} catch (error) {
			console.error('Erro ao deletar regra:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao deletar regra');
		}
	}

	async buscarRegraValida(etapa_id: string, mensagem: string, ticket_id?: string, fluxo_id?: string) {
		try {
			const condicoes = await this.prisma.condicao.findMany({
				where: { etapa_id },
				omit: { is_deleted: true, created_at: true, updated_at: true },
				include: {
					regras: {
						omit: { is_deleted: true, created_at: true, updated_at: true, tenant_id: true },
					},
				},
			});

			if (condicoes.length === 0) {
				return null;
			}

			// procurar a primeira regra válida
			let regraEncontrada: CondicaoRegra | null = null;
			
			let logData = {
				ticket_id,
				etapa_id,
				fluxo_id,
				tenant_id: condicoes[0].tenant_id
			} as CreateLog;


			for (const condicao of condicoes) {
				for (const regra of condicao.regras) {
					if (regra.msg_exata) {
						if (regra.input === mensagem) {
							regraEncontrada = regra as CondicaoRegra;
							break;
						}
					} else {
						if (mensagem.includes(regra.input)) {
							regraEncontrada = regra as CondicaoRegra;
							break;
						}
					}
				}
				if (regraEncontrada) {
					logData.opcao_id = regraEncontrada.id
					break
				}
			}

			if (!regraEncontrada) {
				logData.opcao_id = null
			}

			await this.logService.create(logData)

			return regraEncontrada;
		} catch (error) {
			console.error('Erro ao buscar regra válida:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao buscar regra válida');
		}
	}


	/**
	 * Mapper centralizado para converter regras de entrada em formato do banco
	 * @param regra - Regra de entrada
	 * @param condicao_id - ID da condição
	 * @param tenant_id - ID do tenant
	 * @param priority - Prioridade da regra (opcional)
	 * @returns Objeto formatado para inserção no banco
	 */
	private mapperRegraToDatabase(
		regra: any,
		condicao_id: string,
		tenant_id: string,
		priority?: number,
	) {
		return {
			condicao_id,
			tenant_id,
			input: regra.input,
			action: regra.action,
			msg_exata: regra.msg_exata,
			next_etapa_id: regra.next_etapa_id || undefined,
			next_fluxo_id: regra.next_fluxo_id || undefined,
			queue_id: regra.queue_id || undefined,
			user_id: regra.user_id || undefined,
			variable_name: regra.variable_name || undefined,
			variable_value: regra.variable_value || undefined,
			api_endpoint: regra.api_endpoint || undefined,
			db_query: regra.db_query || undefined,
			priority: priority || regra.priority || 0,
		};
	}

	/**
	 * Mapper para converter regra do banco para formato de resposta
	 * @param regra - Regra do banco de dados
	 * @returns Regra formatada para resposta
	 */
	private mapperRegraToResponse(regra: any): CondicaoRegra {
		return {
			id: regra.id,
			condicao_id: regra.condicao_id,
			tenant_id: regra.tenant_id,
			input: regra.input,
			action: regra.action,
			msg_exata: regra.msg_exata,
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
	 * Mapper para converter condição do banco para formato de resposta
	 * @param condicao - Condição do banco de dados
	 * @returns Transação formatada para resposta
	 */
	private mapperCondicaoToResponse(condicao: any) {
		return {
			...condicao,
			regras: condicao.regras
				? condicao.regras.map(regra => this.mapperRegraToResponse(regra))
				: [],
		};
	}
}
