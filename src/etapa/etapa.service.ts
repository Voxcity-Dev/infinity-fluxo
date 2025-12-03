import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateEtapaInput } from './dto/create-etapa.dto';
import { ListEtapasInput } from './dto/list-etapa.dto';
import { UpdateEtapaInput, UpdateEtapaPositionInput } from './dto/update-etapa.dto';
import { api_core } from 'src/infra/config/axios/core';

type EtapaVariavel = {
	id: string;
	regex: string | null;
	mensagem_erro: string | null;
};

type EtapaWithVariavel<T> = T & {
	variavel?: EtapaVariavel;
};

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

			// Construir objeto de query base
			const queryOptions: any = {
				where,
				orderBy: {
					created_at: 'desc',
				},
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const etapas = await this.prisma.etapas.findMany(queryOptions);

			// Contar total de registros para paginação
			const total = await this.prisma.etapas.count({ where });

			// Retornar resposta com ou sem paginação baseado na presença dos parâmetros
			if (page && limit) {
				return {
					data: etapas,
					meta: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
					},
				};
			} else {
				return {
					data: etapas,
					meta: {
						total,
					},
				};
			}
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
			const etapaBase = await this.prisma.etapas.findUnique({
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
									variavel_id: true,
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

			if (!etapaBase) {
				throw new NotFoundException('Etapa não encontrada');
			}

			const etapa: EtapaWithVariavel<typeof etapaBase> = etapaBase;

			const variavelId = etapa.condicao[0].regras[0].variavel_id;

			// Buscar informações da variável se a etapa tiver variavel_id
			if (variavelId) {
				try {
					const variavelResponse = await api_core.get(`/variaveis/${variavelId}`);
					const variavel = variavelResponse.data;

					// Adicionar informações da variável à etapa
					etapa.variavel = {
						id: variavelId,
						regex: variavel?.mascara_variaveis?.regex || null,
						mensagem_erro: variavel?.mascara_variaveis?.mensagem_erro || null,
					};
				} catch (error) {
					console.error('Erro ao buscar variável do core:', error);
					// Continuar mesmo se não conseguir buscar a variável
				}
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
			const { tenant_id, fluxo_id, nome, tipo, interacoes_id, variavel_id, metadados } = data;

			// Garantir que metadados tenham pelo menos a estrutura de position padrão
			const metadadosComPadrao = metadados
				? {
						...metadados,
						position: {
							x: (metadados as any)?.position?.x ?? 100,
							y: (metadados as any)?.position?.y ?? 100,
							...((metadados as any)?.position || {}),
						},
					}
				: undefined; // Se não enviado, o Prisma usará o default do schema

			const etapa = await this.prisma.etapas.create({
				data: {
					tenant_id,
					fluxo_id,
					nome,
					tipo,
					interacoes_id: interacoes_id || null,
					variavel_id: variavel_id || null,
					metadados: metadadosComPadrao,
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
			const { id, nome, tipo, interacoes_id, variavel_id, metadados } = data;

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

			if (variavel_id !== undefined) {
				updateData.variavel_id = variavel_id || null;
			}

			if (metadados !== undefined && metadados !== null) {
				// Se metadados foram enviados, buscar a etapa atual para fazer merge
				const etapaAtual = await this.prisma.etapas.findUnique({
					where: { id },
					select: { metadados: true },
				});

				// Fazer merge dos metadados existentes com os novos
				const metadadosExistentes = (etapaAtual?.metadados as Record<string, any>) || {};
				const metadadosNovos = metadados as Record<string, any>;

				// Fazer merge profundo para preservar position.x e position.y
				updateData.metadados = {
					...metadadosExistentes,
					...metadadosNovos,
					position: {
						...(metadadosExistentes.position || {}),
						...(metadadosNovos.position || {}),
					},
				};
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

	async updatePosition(id: string, position: UpdateEtapaPositionInput['position']) {
		try {
			const etapaAtual = await this.prisma.etapas.findUnique({
				where: { id },
				select: { metadados: true, is_deleted: true },
			});

			if (!etapaAtual || etapaAtual.is_deleted) {
				throw new NotFoundException('Etapa não encontrada');
			}

			const metadadosExistentes = (etapaAtual.metadados as Record<string, any>) || {};
			const metadadosAtualizados = {
				...metadadosExistentes,
				position: {
					...(metadadosExistentes.position || {}),
					x: position.x,
					y: position.y,
				},
			};

			const etapa = await this.prisma.etapas.update({
				where: { id },
				data: {
					metadados: metadadosAtualizados,
				},
			});

			return etapa;
		} catch (error) {
			console.error('Erro ao atualizar posição da etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar posição da etapa');
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
			const etapaBase = await this.prisma.etapas.findFirst({
				where: {
					fluxo_id,
					tipo: 'INICIO',
				},
				select: {
					id: true,
					nome: true,
					tipo: true,
					interacoes_id: true,
					variavel_id: true,
					metadados: true,
					interacoes: {
						select: { conteudo: true, tipo: true, url_midia: true, metadados: true },
					},
				},
			});

			if (!etapaBase) {
				throw new NotFoundException('Etapa de início não encontrada');
			}

			const etapa: EtapaWithVariavel<typeof etapaBase> = etapaBase;

			// Buscar informações da variável se a etapa tiver variavel_id
			if (etapa.variavel_id) {
				try {
					const variavelResponse = await api_core.get(`/variaveis/${etapa.variavel_id}`);
					const variavel = variavelResponse.data;

					// Adicionar informações da variável à etapa
					etapa.variavel = {
						id: etapa.variavel_id,
						regex: variavel?.mascara_variaveis?.regex || null,
						mensagem_erro: variavel?.mascara_variaveis?.mensagem_erro || null,
					};
				} catch (error) {
					console.error('Erro ao buscar variável do core:', error);
					// Continuar mesmo se não conseguir buscar a variável
				}
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
