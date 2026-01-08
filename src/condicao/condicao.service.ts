import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateCondicaoInput } from './dto/create-condicao.dto';
import { ListCondicoesInput } from './dto/list-condicao.dto';
import { CondicaoRegra } from 'src/schemas/condicao.schema';
import { UpdateCondicaoRegraInput } from './dto/update-condicao-regra.dto';
import { UpsertCondicaoInput } from './dto/upsert-condicao.dto';
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

			// Validar se a etapa existe antes de criar a condição
			const etapa = await this.prisma.etapas.findFirst({
				where: {
					id: etapa_id,
					tenant_id,
					is_deleted: false,
				},
			});

			if (!etapa) {
				throw new NotFoundException(
					`Etapa com ID ${etapa_id} não encontrada ou não pertence ao tenant. Certifique-se de que a etapa foi salva antes de criar condições.`
				);
			}

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
						// Garantir que input seja sempre um array
						let inputArray: string[] = [];
						const inputValue: any = regra.input;
						if (Array.isArray(inputValue)) {
							// Validar que todos os elementos são strings
							inputArray = inputValue.filter((item): item is string => typeof item === 'string');
						} else if (inputValue && typeof inputValue === 'string' && inputValue.trim() !== '') {
							// Backward compatibility: converter string para array
							inputArray = [inputValue];
						} else {
							inputArray = [];
						}

						// REGRA EXISTE: Atualizar apenas input, action e limpar outros campos
						await prisma.condicaoRegra.update({
							where: {
								id: regra.id,
								condicao_id,
								is_deleted: false,
							},
							data: {
								input: inputArray,
								action: regra.action,
								msg_exata: regra.msg_exata || false,
								next_etapa_id: regra.next_etapa_id || undefined,
								next_fluxo_id: regra.next_fluxo_id || undefined,
								queue_id: regra.queue_id || undefined,
								user_id: regra.user_id || undefined,
								variavel_id: regra.variavel_id || undefined,
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

	async upsertCondicao(data: UpsertCondicaoInput) {
		try {
			const { tenant_id, etapa_id, regras } = data;

			// Validar se a etapa existe antes de criar/atualizar a condição
			const etapa = await this.prisma.etapas.findFirst({
				where: {
					id: etapa_id,
					tenant_id,
					is_deleted: false,
				},
			});

			if (!etapa) {
				throw new NotFoundException(
					`Etapa com ID ${etapa_id} não encontrada ou não pertence ao tenant. Certifique-se de que a etapa foi salva antes de criar condições.`
				);
			}

			const resultado = await this.prisma.$transaction(async prisma => {
				// Buscar condição existente para a etapa
				let condicao = await prisma.condicao.findFirst({
					where: {
						etapa_id,
						tenant_id,
						is_deleted: false,
					},
					include: {
						regras: {
							where: { is_deleted: false },
							orderBy: { priority: 'asc' },
						},
					},
				});

				// Se não existe condição, criar uma nova
				if (!condicao) {
					condicao = await prisma.condicao.create({
						data: {
							tenant_id,
							etapa_id,
						},
						include: {
							regras: true,
						},
					});

					// Criar todas as regras (modo criação)
					if (regras && regras.length > 0) {
						const regrasData = regras
							.filter(regra => !regra.is_deleted)
							.map((regra, index) =>
								this.mapperRegraToDatabase(regra, condicao!.id, tenant_id, regra.priority || index),
							);

						if (regrasData.length > 0) {
							await prisma.condicaoRegra.createMany({
								data: regrasData,
								skipDuplicates: true,
							});
						}
					}
				} else {
					// Condição existe, processar regras (modo atualização)
					if (regras && regras.length > 0) {
						for (const regra of regras) {
							// Se tem is_deleted: true, marcar como deletada
							if (regra.is_deleted && regra.id) {
								await prisma.condicaoRegra.update({
									where: {
										id: regra.id,
										condicao_id: condicao.id,
									},
									data: { is_deleted: true },
								});
								continue;
							}

							// Se não deve ser deletada, processar normalmente
							if (!regra.is_deleted) {
								if (regra.id) {
									// Verificar se a regra existe no banco
									const regraExistente = await prisma.condicaoRegra.findFirst({
										where: {
											id: regra.id,
											condicao_id: condicao.id,
											is_deleted: false,
										},
									});

									if (regraExistente) {
										// Garantir que input seja sempre um array
										let inputArray: string[] = [];
										const inputValue: any = regra.input;
										if (Array.isArray(inputValue)) {
											// Validar que todos os elementos são strings
											inputArray = inputValue.filter((item): item is string => typeof item === 'string');
										} else if (inputValue && typeof inputValue === 'string' && inputValue.trim() !== '') {
											// Backward compatibility: converter string para array
											inputArray = [inputValue];
										} else {
											inputArray = [];
										}

										// REGRA EXISTE: Atualizar
										await prisma.condicaoRegra.update({
											where: {
												id: regra.id,
												condicao_id: condicao.id,
											},
											data: {
												input: inputArray,
												action: regra.action,
												msg_exata: regra.msg_exata || false,
												next_etapa_id: regra.next_etapa_id || undefined,
												next_fluxo_id: regra.next_fluxo_id || undefined,
												queue_id: regra.queue_id || undefined,
												user_id: regra.user_id || undefined,
												variavel_id: regra.variavel_id || undefined,
												api_endpoint: regra.api_endpoint || undefined,
												db_query: regra.db_query || undefined,
												priority: regra.priority || 0,
											},
										});
									} else {
										// ID fornecido mas não existe: criar nova
										const novaRegra = this.mapperRegraToDatabase(
											regra,
											condicao.id,
											tenant_id,
											regra.priority || 0,
										);
										await prisma.condicaoRegra.create({
											data: novaRegra,
										});
									}
								} else {
									// REGRA NÃO TEM ID: Criar nova regra
									const novaRegra = this.mapperRegraToDatabase(
										regra,
										condicao.id,
										tenant_id,
										regra.priority || 0,
									);
									await prisma.condicaoRegra.create({
										data: novaRegra,
									});
								}
							}
						}
					}
				}

				// Retornar a condição com suas regras atualizadas
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
			console.error('Erro ao fazer upsert de condição:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao fazer upsert de condição');
		}
	}

	async deletar(regra_id: string) {
		try {
			const regra = await this.prisma.$transaction(async prisma => {
				// 1. Deletar a regra
				await prisma.condicaoRegra.update({
					where: {
						id: regra_id,
						is_deleted: false,
					},
					data: { is_deleted: true },
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

	async buscarRegraValida(
		etapa_id: string,
		mensagem: string,
		ticket_id?: string,
		fluxo_id?: string,
		executarSegundaRegra: boolean = false,
	) {
		try {
			console.log(`[buscarRegraValida] INÍCIO - etapa_id=${etapa_id}, mensagem="${mensagem}", executarSegundaRegra=${executarSegundaRegra}`);

			const condicoes = await this.prisma.condicao.findMany({
				where: {
					etapa_id,
					is_deleted: false,
				},
				include: {
					regras: {
						where: {
							is_deleted: false,
						},
						orderBy: {
							priority: 'asc',
						},
					},
				},
			});

			console.log(`[buscarRegraValida] Condições encontradas: ${condicoes.length}`);

			if (condicoes.length === 0) {
				console.log(`[buscarRegraValida] NENHUMA condição encontrada - retornando null`);
				return null;
			}

			// Se executarSegundaRegra é true, buscar a regra de navegação que corresponde à mensagem
			if (executarSegundaRegra) {
				console.log(`[buscarRegraValida] Buscando regra de navegação (executarSegundaRegra=true) - Mensagem: "${mensagem}"`);

				for (const condicao of condicoes) {
					// Ordenar todas as regras por prioridade
					const regrasOrdenadas = condicao.regras
						.sort((a, b) => a.priority - b.priority);

					// Filtrar apenas regras de navegação (não SETAR_VARIAVEL)
					const regrasNavegacao = regrasOrdenadas.filter(r =>
						r.action === 'ETAPA' ||
						r.action === 'FLUXO' ||
						r.action === 'FILA' ||
						r.action === 'USUARIO'
					);

					console.log(`[buscarRegraValida] Total de regras de navegação: ${regrasNavegacao.length}`);
					console.log(`[buscarRegraValida] Regras de navegação:`, regrasNavegacao.map(r => ({
						action: r.action,
						priority: r.priority,
						queue_id: r.queue_id,
						input: r.input,
						msg_exata: r.msg_exata,
					})));

					// Buscar regra que corresponde à mensagem do usuário
					let regraCorrespondente: typeof regrasNavegacao[0] | null = null;

					for (const regra of regrasNavegacao) {
						// Converter input para array
						let inputArray: string[] = [];
						if (Array.isArray(regra.input)) {
							inputArray = regra.input.filter((item): item is string => typeof item === 'string');
						} else if (regra.input && typeof regra.input === 'string' && regra.input.trim() !== '') {
							inputArray = [regra.input];
						}

						console.log(`[buscarRegraValida] Avaliando regra ${regra.id}: action=${regra.action}, queue_id=${regra.queue_id}, input=${JSON.stringify(inputArray)}`);

						// Se não há inputs, pular para verificar próxima regra
						if (inputArray.length === 0) {
							console.log(`[buscarRegraValida]   ⏭️ Input vazio - pulando`);
							continue;
						}

						// Verificar correspondência
						let encontrou = false;
						if (regra.msg_exata) {
							encontrou = inputArray.some(input => {
								const inputTrimmed = input.trim();
								const mensagemTrimmed = mensagem.trim();
								const match = inputTrimmed.toLowerCase() === mensagemTrimmed.toLowerCase();
								console.log(`[buscarRegraValida]   Comparação EXATA: "${inputTrimmed}" === "${mensagemTrimmed}" ? ${match}`);
								return match;
							});
						} else {
							encontrou = inputArray.some(input => {
								const inputTrimmed = input.trim();
								const mensagemTrimmed = mensagem.trim();
								const match = mensagemTrimmed.toLowerCase().includes(inputTrimmed.toLowerCase());
								console.log(`[buscarRegraValida]   Comparação PARCIAL: "${mensagemTrimmed}" contains "${inputTrimmed}" ? ${match}`);
								return match;
							});
						}

						if (encontrou) {
							console.log(`[buscarRegraValida]   ✅ MATCH! Regra selecionada: queue_id=${regra.queue_id}`);
							regraCorrespondente = regra;
							break;
						} else {
							console.log(`[buscarRegraValida]   ❌ NO MATCH`);
						}
					}

					// Se encontrou regra correspondente, retornar
					if (regraCorrespondente) {
						console.log(`[buscarRegraValida] Regra de navegação correspondente encontrada: action=${regraCorrespondente.action}, queue_id=${regraCorrespondente.queue_id}`);
						const logData = {
							ticket_id,
							etapa_id,
							fluxo_id,
							tenant_id: condicao.tenant_id,
							opcao_id: regraCorrespondente.id,
						} as CreateLog;
						await this.logService.create(logData);
						return regraCorrespondente as unknown as CondicaoRegra;
					}

					// Verificar se alguma regra de navegação tem input configurado
					const regrasComInput = regrasNavegacao.filter(r => {
						const input = Array.isArray(r.input) ? r.input : [];
						return input.length > 0;
					});

					// Se existem regras com input mas nenhuma correspondeu = opção inválida
					if (regrasComInput.length > 0) {
						console.log(`[buscarRegraValida] ❌ OPÇÃO INVÁLIDA: Mensagem "${mensagem}" não corresponde a nenhuma das ${regrasComInput.length} regras com input configurado`);
						// Retornar null para indicar opção inválida - fluxo deve usar mensagem de erro
						const logData = {
							ticket_id,
							etapa_id,
							fluxo_id,
							tenant_id: condicao.tenant_id,
							opcao_id: null,
						} as CreateLog;
						await this.logService.create(logData);
						return null;
					}

					// Se não há regras com input, usar a primeira regra de navegação (fluxo sem menu)
					const primeiraRegraNavegacao = regrasNavegacao[0];
					if (primeiraRegraNavegacao) {
						console.log(`[buscarRegraValida] Usando primeira regra de navegação (sem menu): action=${primeiraRegraNavegacao.action}, queue_id=${primeiraRegraNavegacao.queue_id}`);
						const logData = {
							ticket_id,
							etapa_id,
							fluxo_id,
							tenant_id: condicao.tenant_id,
							opcao_id: primeiraRegraNavegacao.id,
						} as CreateLog;
						await this.logService.create(logData);
						return primeiraRegraNavegacao as unknown as CondicaoRegra;
					}

					// Fallback final: pegar segunda regra por prioridade (pode ser SETAR_VARIAVEL para coleta sequencial)
					const segundaRegra = regrasOrdenadas.length > 1 ? regrasOrdenadas[1] : null;
					if (segundaRegra) {
						console.log(`[buscarRegraValida] Segunda regra (fallback final) encontrada: action=${segundaRegra.action}, next_etapa_id=${segundaRegra.next_etapa_id}, variavel_id=${segundaRegra.variavel_id}`);
						const logData = {
							ticket_id,
							etapa_id,
							fluxo_id,
							tenant_id: condicao.tenant_id,
							opcao_id: segundaRegra.id,
						} as CreateLog;
						await this.logService.create(logData);
						return segundaRegra as unknown as CondicaoRegra;
					}
				}

				console.log(`[buscarRegraValida] NENHUMA regra encontrada - retornando null`);
				return null;
			}

			// procurar a primeira regra válida
			console.log(`[buscarRegraValida] Buscando primeira regra válida (executarSegundaRegra=false)`);
			let regraEncontrada: CondicaoRegra | null = null;

			const logData = {
				ticket_id,
				etapa_id,
				fluxo_id,
				tenant_id: condicoes[0].tenant_id,
			} as CreateLog;

			for (const condicao of condicoes) {
				console.log(`[buscarRegraValida] Processando condição ${condicao.id} com ${condicao.regras.length} regras`);

				for (const regra of condicao.regras) {
					// Log detalhado de cada regra sendo avaliada
					console.log(`[buscarRegraValida] === AVALIANDO REGRA ===`);
					console.log(`[buscarRegraValida]   ID: ${regra.id}`);
					console.log(`[buscarRegraValida]   Action: ${regra.action}`);
					console.log(`[buscarRegraValida]   Priority: ${regra.priority}`);
					console.log(`[buscarRegraValida]   Input: ${JSON.stringify(regra.input)}`);
					console.log(`[buscarRegraValida]   Msg Exata: ${regra.msg_exata}`);
					console.log(`[buscarRegraValida]   Queue ID: ${regra.queue_id}`);
					console.log(`[buscarRegraValida]   Mensagem do usuário: "${mensagem}"`);

					// Se a regra é SETAR_VARIAVEL, não precisa de input - retorna diretamente
					if (regra.action === 'SETAR_VARIAVEL') {
						console.log(`[buscarRegraValida] ✅ MATCH: Regra SETAR_VARIAVEL - não precisa de input`);
						regraEncontrada = regra as unknown as CondicaoRegra;
						break;
					}

					// Converter input para array se necessário (backward compatibility)
					let inputArray: string[] = [];
					if (Array.isArray(regra.input)) {
						// Validar que todos os elementos são strings
						inputArray = regra.input.filter((item): item is string => typeof item === 'string');
					} else if (regra.input && typeof regra.input === 'string' && regra.input.trim() !== '') {
						inputArray = [regra.input];
					}

					// Se não há inputs, pular esta regra
					if (inputArray.length === 0) {
						console.log(`[buscarRegraValida] ⏭️ SKIP: Input vazio - pulando regra`);
						continue;
					}

					// Verificar se a mensagem corresponde a algum input do array
					let encontrou = false;
					if (regra.msg_exata) {
						// Correspondência exata: percorrer o array e verificar se mensagem é igual a algum input (case-insensitive)
						console.log(`[buscarRegraValida]   Comparação EXATA:`);
						encontrou = inputArray.some(input => {
							// Comparação exata, removendo espaços no início e fim
							const inputTrimmed = input.trim();
							const mensagemTrimmed = mensagem.trim();
							const match = inputTrimmed.toLowerCase() === mensagemTrimmed.toLowerCase();
							console.log(`[buscarRegraValida]     "${inputTrimmed}" === "${mensagemTrimmed}" ? ${match}`);
							return match;
						});
					} else {
						// Correspondência parcial: verificar se mensagem contém algum input
						console.log(`[buscarRegraValida]   Comparação PARCIAL:`);
						encontrou = inputArray.some(input => {
							const inputTrimmed = input.trim();
							const mensagemTrimmed = mensagem.trim();
							const match = mensagemTrimmed.toLowerCase().includes(inputTrimmed.toLowerCase());
							console.log(`[buscarRegraValida]     "${mensagemTrimmed}" contains "${inputTrimmed}" ? ${match}`);
							return match;
						});
					}

					if (encontrou) {
						console.log(`[buscarRegraValida] ✅ MATCH: Mensagem "${mensagem}" corresponde à regra - Queue: ${regra.queue_id}`);
						regraEncontrada = regra as unknown as CondicaoRegra;
						break;
					} else {
						console.log(`[buscarRegraValida] ❌ NO MATCH: Mensagem não corresponde a esta regra`);
					}
				}
				if (regraEncontrada) {
					logData.opcao_id = regraEncontrada.id;
					break;
				}
			}

			if (!regraEncontrada) {
				console.log(`[buscarRegraValida] NENHUMA regra encontrada para mensagem "${mensagem}"`);
				logData.opcao_id = null;
			} else {
				console.log(`[buscarRegraValida] Regra encontrada: id=${regraEncontrada.id}, action=${regraEncontrada.action}`);
			}

			// Só criar log se fluxo_id e ticket_id existirem
			if (fluxo_id && ticket_id) {
				await this.logService.create(logData);
			}

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
		// Garantir que input seja sempre um array JSON
		let inputArray: string[] = [];
		if (Array.isArray(regra.input)) {
			// Validar que todos os elementos são strings
			inputArray = regra.input.filter((item): item is string => typeof item === 'string');
		} else if (regra.input && typeof regra.input === 'string' && regra.input.trim() !== '') {
			// Backward compatibility: converter string para array
			inputArray = [regra.input];
		} else {
			inputArray = [];
		}

		return {
			condicao_id,
			tenant_id,
			input: inputArray,
			action: regra.action,
			msg_exata: regra.msg_exata,
			next_etapa_id: regra.next_etapa_id || undefined,
			next_fluxo_id: regra.next_fluxo_id || undefined,
			queue_id: regra.queue_id || undefined,
			user_id: regra.user_id || undefined,
			variavel_id: regra.variavel_id || undefined,
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
		// Garantir que input seja sempre um array
		let inputArray: string[] = [];
		if (Array.isArray(regra.input)) {
			// Validar que todos os elementos são strings
			inputArray = regra.input.filter((item): item is string => typeof item === 'string');
		} else if (regra.input && typeof regra.input === 'string' && regra.input.trim() !== '') {
			// Backward compatibility: converter string para array
			inputArray = [regra.input];
		} else {
			inputArray = [];
		}

		return {
			id: regra.id,
			condicao_id: regra.condicao_id,
			tenant_id: regra.tenant_id,
			input: inputArray,
			action: regra.action,
			msg_exata: regra.msg_exata,
			next_etapa_id: regra.next_etapa_id,
			next_fluxo_id: regra.next_fluxo_id,
			queue_id: regra.queue_id,
			user_id: regra.user_id,
			variavel_id: regra.variavel_id,
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
