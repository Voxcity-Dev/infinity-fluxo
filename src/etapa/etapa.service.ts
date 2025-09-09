import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateEtapaInput } from './dto/create-etapa.dto';
import { ListEtapasInput } from './dto/list-etapa.dto';
import { UpdateEtapaInput } from './dto/update-etapa.dto';

@Injectable()
export class EtapaService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(params: ListEtapasInput) {
		try {
			const { page, limit, search, tenant_id, fluxo_id, interacoes_id, tipo } = params;

			// Construir o filtro where apenas com campos válidos da tabela
			const where: any = {
				tenant_id,
				is_deleted: false, // Sempre filtrar registros não deletados
			};

			// Adicionar filtros opcionais apenas se fornecidos
			if (fluxo_id) where.fluxo_id = fluxo_id;
			if (interacoes_id) where.interacoes_id = interacoes_id;
			if (tipo) where.tipo = tipo;

			// Adicionar busca por texto no campo nome se search for fornecido
			if (search) {
				where.nome = {
					contains: search,
					mode: 'insensitive', // Busca case-insensitive
				};
			}

			const etapas = await this.prisma.etapas.findMany({
				where,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			// Contar total de registros para paginação
			const total = await this.prisma.etapas.count({ where });

			return {
				data: etapas,
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error('Erro ao listar etapas:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao listar etapas');
		}
	}

	async findById(id: string) {
		try {
			const etapa = await this.prisma.etapas.findUnique({
				where: {
					id,
					is_deleted: false, // Garantir que não retorne etapas deletadas
				},
				omit: {
					created_at: true,
					updated_at: true,
				},
				include: {
					// Informações do fluxo pai
					fluxo: {
						select: {
							id: true,
							nome: true,
						},
					},
					// Interação associada à etapa
					interacoes: {
						where: {
							is_deleted: false,
						},
						select: {
							id: true,
							nome: true,
							tipo: true,
							conteudo: true,
							url_midia: true,
							metadados: true,
						},
					},
					// Transações da etapa com suas regras
					condicao: {
						where: {
							is_deleted: false,
						},
						omit: {
							tenant_id: true,
							created_at: true,
							updated_at: true,
						},
						include: {
							regras: {
								where: {
									is_deleted: false,
								},
								select: {
									id: true,
									condicao_id: true,
									input: true,
									action: true,
									next_etapa_id: true,
									next_fluxo_id: true,
									queue_id: true,
									user_id: true,
									variable_name: true,
									variable_value: true,
									api_endpoint: true,
									db_query: true,
									priority: true,
								},
								orderBy: {
									priority: 'asc',
								},
							},
						},
						orderBy: {
							created_at: 'desc',
						},
					},
				},
			});

			if (!etapa) {
				throw new NotFoundException('Etapa não encontrada');
			}

			return etapa;
		} catch (error) {
			console.error('Erro ao buscar etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao buscar etapa');
		}
	}

	async create(data: CreateEtapaInput) {
		try {
			const { tenant_id, fluxo_id, nome, tipo, interacoes_id } = data;

			const etapa = await this.prisma.etapas.create({
				data: {
					tenant_id,
					fluxo_id,
					nome,
					tipo,
					interacoes_id: interacoes_id || null,
				},
			});

			return etapa;
		} catch (error) {
			console.error('Erro ao criar etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao criar etapa');
		}
	}

	async update(data: UpdateEtapaInput) {
		try {
			const { id, nome, tipo, interacoes_id } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};

			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}

			if (tipo !== undefined && tipo !== null) {
				updateData.tipo = tipo;
			}

			if (interacoes_id !== undefined) {
				updateData.interacoes_id = interacoes_id || null;
			}

			// Verificar se há pelo menos um campo para atualizar
			if (Object.keys(updateData).length === 0) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			const etapa = await this.prisma.etapas.update({
				where: {
					id,
					is_deleted: false, // Garantir que não atualize etapas deletadas
				},
				data: updateData,
			});

			return etapa;
		} catch (error) {
			console.error('Erro ao atualizar etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar etapa');
		}
	}

	async delete(id: string) {
		try {
			const etapa = await this.prisma.etapas.findUnique({
				where: { id },
			});

			if (!etapa) {
				throw new NotFoundException('Etapa não encontrada');
			}

			await this.prisma.etapas.update({
				where: { id },
				data: { is_deleted: true },
			});
		} catch (error) {
			console.error('Erro ao deletar etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao deletar etapa');
		}
	}

	async getEtapaInicio(fluxo_id: string) {
		try {
			const etapa = await this.prisma.etapas.findFirst({
				where: {
					fluxo_id,
					tipo: 'INICIO',
				},
				omit: {
					tenant_id: true,
					fluxo_id: true,
					created_at: true,
					updated_at: true,
					is_deleted: true,
				},
				include: {
					interacoes: {
						select: { conteudo: true, tipo: true, url_midia: true, metadados: true },
					}
				}
			});

			if (!etapa) {
				throw new NotFoundException('Etapa de início não encontrada');
			}

			return etapa;
		} catch (error) {
			console.error('Erro ao buscar etapa de início:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao buscar etapa de início');
		}
	}

	async getInteracoesByEtapaId(etapa_id: string) {
		try {
			const interacoes = await this.prisma.interacoes.findMany({
				where: { etapas: { some: { id: etapa_id } }, is_deleted: false },
			});

			if (!interacoes) {
				throw new NotFoundException('Interações não encontradas');
			}

			const interacoesMap = interacoes.map(interacao => ({
				conteudo: interacao.conteudo,
			}));

			return interacoesMap;
		} catch (error) {
			console.error('Erro ao buscar interações:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar interações');
		}
	}

	
}
