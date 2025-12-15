import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import { FluxoEngineInput, ListFluxosInput } from './dto/list-fluxo.dto';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { EtapaService } from 'src/etapa/etapa.service';
import { CondicaoRegra, InteracaoTipo } from 'src/schemas';
import { CondicaoService } from 'src/condicao/condicao.service';
import { ConfigService } from 'src/common/services/config.service';
import { FlowConfiguracaoChave, FLUXO_CONFIGURACAO_CHAVES } from 'src/schemas/fluxo.schema';
import { api_core } from 'src/infra/config/axios/core';
import { AxiosError } from 'axios';

@Injectable()
export class FluxoService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly etapaService: EtapaService,
		private readonly condicaoService: CondicaoService,
		private readonly configService: ConfigService,
	) {}

	async engine(data: FluxoEngineInput) {
		try {
			const { etapa_id, fluxo_id, conteudo, ticket_id, executar_segunda_regra } = data;

			console.log(`[FluxoService] Executando engine - etapa_id: ${etapa_id || 'vazio'}, fluxo_id: ${fluxo_id}, ticket_id: ${ticket_id}`);

			if (!etapa_id) {
				console.log(`[FluxoService] Etapa inicial - buscando etapa de início para fluxo ${fluxo_id}`);
				const etapa = await this.etapaService.getEtapaInicio(fluxo_id);
				console.log(`[FluxoService] Etapa de início encontrada:`, {
					id: etapa?.id,
					hasInteracoes: !!etapa?.interacoes,
					tipoInteracao: etapa?.interacoes?.tipo,
				});
				const resultado = await this.responseFluxoEnginer(etapa, {
					etapa_id: etapa.id,
					fluxo_id,
					ticket_id,
					variavel_id: etapa.variavel_id,
				});
				console.log(`[FluxoService] Resultado do responseFluxoEnginer:`, JSON.stringify(resultado, null, 2));
				return resultado;
			}

			const mensagem = this.extrairMensagem(conteudo);
			console.log(`[FluxoService] Mensagem extraída: ${mensagem}`);

			// Buscar regra válida
			const regraEncontrada = await this.condicaoService.buscarRegraValida(
				etapa_id,
				mensagem,
				ticket_id,
				fluxo_id,
				executar_segunda_regra || false,
			);

			console.log(`[FluxoService] Regra encontrada:`, {
				hasRegra: !!regraEncontrada,
				action: regraEncontrada?.action,
			});

			// Executar ação da regra
			const resultado = await this.executarAcaoRegra(regraEncontrada, fluxo_id, etapa_id);

			console.log(`[FluxoService] Resultado do executarAcaoRegra:`, {
				etapa_id: resultado.etapa_id,
				hasConteudo: !!resultado.conteudo,
				conteudoMensagem: resultado.conteudo?.mensagem,
			});

			return {
				etapa_id: resultado.etapa_id,
				conteudo: resultado.conteudo,
				fluxo_id: resultado.fluxo_id || fluxo_id,
				ticket_id,
				queue_id: resultado.queue_id,
				user_id: resultado.user_id,
				variavel_id: resultado.variavel_id,
				regex: resultado.regex,
				mensagem_erro: resultado.mensagem_erro,
			};
		} catch (error) {
			console.error('[FluxoService] Erro ao executar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao executar fluxo');
		}
	}

	async findAll(params: ListFluxosInput) {
		try {
			const { page, limit, search, tenant_id } = params;

			// Construir objeto de query base
			const queryOptions: any = {
				where: {
					tenant_id,
					nome: {
						contains: search,
					},
					is_deleted: false,
				},
				orderBy: {
					created_at: 'desc',
				},
				include: {
					configuracoes: {
						where: {
							chave: {
								in: ['MENSAGEM_FINALIZACAO', 'MENSAGEM_INVALIDA'],
							},
						},
						select: {
							chave: true,
							valor: true,
						},
					},
				},
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const fluxos = await this.prisma.fluxo.findMany(queryOptions);

			// Mapear configurações para campos planos
			return fluxos.map((fluxo: any) => {
				const mensagemFinalizacao = fluxo.configuracoes?.find(
					(c: any) => c.chave === 'MENSAGEM_FINALIZACAO',
				)?.valor;
				const mensagemInvalida = fluxo.configuracoes?.find(
					(c: any) => c.chave === 'MENSAGEM_INVALIDA',
				)?.valor;

				// Remover configuracoes do objeto e adicionar campos planos
				const { configuracoes, ...fluxoData } = fluxo;
				return {
					...fluxoData,
					mensagem_finalizacao: mensagemFinalizacao || null,
					mensagem_invalida: mensagemInvalida || null,
				};
			});
		} catch (error) {
			console.error('Erro ao listar fluxos:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao listar fluxos');
		}
	}

	async findById(fluxo_id: string) {
		try {
			const fluxo = await this.prisma.fluxo.findUnique({
				where: {
					id: fluxo_id,
					is_deleted: false, // Garantir que não retorne fluxos deletados
				},
				include: {
					configuracoes: {
						where: {
							chave: {
								in: ['MENSAGEM_FINALIZACAO', 'MENSAGEM_INVALIDA'],
							},
						},
						select: {
							chave: true,
							valor: true,
						},
					},
				},
			});

			if (!fluxo) {
				throw new NotFoundException('Fluxo não encontrado');
			}

			// Mapear configurações para campos planos
			const mensagemFinalizacao = (fluxo as any).configuracoes?.find(
				(c: any) => c.chave === 'MENSAGEM_FINALIZACAO',
			)?.valor;
			const mensagemInvalida = (fluxo as any).configuracoes?.find(
				(c: any) => c.chave === 'MENSAGEM_INVALIDA',
			)?.valor;

			const { configuracoes, ...fluxoData } = fluxo as any;
			return {
				...fluxoData,
				mensagem_finalizacao: mensagemFinalizacao || null,
				mensagem_invalida: mensagemInvalida || null,
			};
		} catch (error) {
			console.error('Erro ao obter fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao obter fluxo');
		}
	}

	async create(data: CreateFluxoInput) {
		try {
			console.log('data', data);

			const fluxo = await this.prisma.fluxo.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
					descricao: data.descricao,
				},
			});

			// Criar configurações padrão após criar o fluxo
			await this.configuracaoDefault(
				data.tenant_id,
				fluxo.id,
				data.mensagem_finalizacao,
				data.mensagem_invalida,
			);

			return fluxo;
		} catch (error) {
			console.error('Erro ao criar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao criar fluxo');
		}
	}

	async update(data: {
		id: string;
		nome?: string;
		descricao?: string;
		mensagem_finalizacao?: string;
		mensagem_invalida?: string;
	}) {
		try {
			const { id, nome, descricao, mensagem_finalizacao, mensagem_invalida } = data;

			// Construir objeto de dados apenas com campos não vazios para a tabela fluxo
			const updateData: any = {};

			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}

			if (descricao !== undefined && descricao !== null && descricao !== '') {
				updateData.descricao = descricao;
			}

			// Verificar se há pelo menos um campo para atualizar na tabela fluxo
			if (Object.keys(updateData).length === 0 && !mensagem_finalizacao && !mensagem_invalida) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			// Atualizar dados básicos do fluxo se houver
			let fluxo: any = null;
			if (Object.keys(updateData).length > 0) {
				fluxo = await this.prisma.fluxo.update({
					where: {
						id,
						is_deleted: false, // Garantir que não atualize fluxos deletados
					},
					data: updateData,
				});
			}

			// Atualizar mensagens se fornecidas
			if (mensagem_finalizacao || mensagem_invalida) {
				await this.updateMensagens({
					fluxo_id: id,
					mensagem_finalizacao,
					mensagem_invalida,
				});
			}

			// Se não atualizou dados básicos, buscar o fluxo atual
			if (!fluxo) {
				fluxo = await this.prisma.fluxo.findFirst({
					where: {
						id,
						is_deleted: false,
					},
				});
			}

			return fluxo;
		} catch (error) {
			console.error('Erro ao atualizar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar fluxo');
		}
	}

	async updateMensagens(data: {
		fluxo_id: string;
		mensagem_finalizacao?: string;
		mensagem_invalida?: string;
	}) {
		try {
			const { fluxo_id, mensagem_finalizacao, mensagem_invalida } = data;

			// Verificar se o fluxo existe
			const fluxo = await this.prisma.fluxo.findFirst({
				where: {
					id: fluxo_id,
					is_deleted: false,
				},
			});

			if (!fluxo) {
				throw new NotFoundException('Fluxo não encontrado');
			}

			// Atualizar mensagem de finalização se fornecida
			if (
				mensagem_finalizacao !== undefined &&
				mensagem_finalizacao !== null &&
				mensagem_finalizacao !== ''
			) {
				const configExistente = await this.prisma.fluxoConfiguracao.findFirst({
					where: {
						fluxo_id,
						chave: 'MENSAGEM_FINALIZACAO',
					},
				});

				if (configExistente) {
					await this.prisma.fluxoConfiguracao.update({
						where: { id: configExistente.id },
						data: { valor: mensagem_finalizacao },
					});
				} else {
					await this.prisma.fluxoConfiguracao.create({
						data: {
							tenant_id: fluxo.tenant_id,
							fluxo_id,
							chave: 'MENSAGEM_FINALIZACAO',
							valor: mensagem_finalizacao,
						},
					});
				}
			}

			// Atualizar mensagem inválida se fornecida
			if (
				mensagem_invalida !== undefined &&
				mensagem_invalida !== null &&
				mensagem_invalida !== ''
			) {
				const configExistente = await this.prisma.fluxoConfiguracao.findFirst({
					where: {
						fluxo_id,
						chave: 'MENSAGEM_INVALIDA',
					},
				});

				if (configExistente) {
					await this.prisma.fluxoConfiguracao.update({
						where: { id: configExistente.id },
						data: { valor: mensagem_invalida },
					});
				} else {
					await this.prisma.fluxoConfiguracao.create({
						data: {
							tenant_id: fluxo.tenant_id,
							fluxo_id,
							chave: 'MENSAGEM_INVALIDA',
							valor: mensagem_invalida,
						},
					});
				}
			}

			return { message: 'Mensagens atualizadas com sucesso' };
		} catch (error) {
			console.error('Erro ao atualizar mensagens:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar mensagens');
		}
	}

	async delete(fluxo_id: string) {
		try {
			await this.prisma.fluxo.update({
				where: { id: fluxo_id },
				data: { is_deleted: true },
			});
		} catch (error) {
			console.error('Erro ao deletar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao deletar fluxo');
		}
	}

	async updateConfiguracao(data: UpdateFluxoConfiguracaoInput) {
		try {
			const { configuracoes } = data;

			// Filtrar apenas configurações com valores válidos (não vazios)
			const configuracoesValidas = configuracoes.filter(
				config => config.valor !== undefined && config.valor !== null && config.valor !== '',
			);

			if (configuracoesValidas.length === 0) {
				throw new BadRequestException('Nenhuma configuração válida fornecida para atualização');
			}

			// Usar transação para garantir consistência
			const resultados = await this.prisma.$transaction(
				configuracoesValidas.map(config =>
					this.prisma.fluxoConfiguracao.update({
						where: { id: config.id },
						data: { valor: config.valor },
					}),
				),
			);

			return resultados;
		} catch (error) {
			console.error('Erro ao atualizar configurações:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar configurações');
		}
	}

	async getInvalidResponseMessage(etapa_id: string) {
		try {
			const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
				where: {
					fluxo: { etapas: { some: { id: etapa_id } } },
					chave: 'MENSAGEM_INVALIDA',
				},
			});

			return configuracao?.valor || this.configService.configuracaoDefaults.MENSAGEM_INVALIDA;
		} catch (error) {
			console.error('Erro ao obter mensagem de resposta inválida:', error);
			return this.configService.configuracaoDefaults.MENSAGEM_INVALIDA;
		}
	}

	private async configuracaoDefault(
		tenant_id: string,
		fluxo_id: string,
		mensagem_finalizacao?: string,
		mensagem_invalida?: string,
	) {
		try {
			// TODO: Quando implementar variáveis de ambiente, usar:
			// const mensagemInvalidaDefault = process.env.MENSAGEM_INVALIDA_DEFAULT || this.configService.configuracaoDefaults.MENSAGEM_INVALIDA;
			// const mensagemFinalizacaoDefault = process.env.MENSAGEM_FINALIZACAO_DEFAULT || this.configService.configuracaoDefaults.MENSAGEM_FINALIZACAO;
			
			// Criar todas as configurações de uma vez, filtrando apenas chaves válidas do enum
			const configuracoes: Array<{
				tenant_id: string;
				fluxo_id: string;
				chave: FlowConfiguracaoChave;
				valor: string;
			}> = Object.entries(this.configService.configuracaoDefaults)
				.filter(([chave]) => FLUXO_CONFIGURACAO_CHAVES.includes(chave as FlowConfiguracaoChave))
				.map(([chave, valor]) => ({
					tenant_id,
					fluxo_id,
					chave: chave as FlowConfiguracaoChave,
					valor: valor as string,
				}));

			// Atualizar ou adicionar mensagem_finalizacao se fornecida
			// Se não fornecida, usa o valor padrão já definido em configuracoes acima
			if (mensagem_finalizacao) {
				const index = configuracoes.findIndex(c => c.chave === 'MENSAGEM_FINALIZACAO');
				if (index >= 0) {
					configuracoes[index].valor = mensagem_finalizacao;
				} else {
					configuracoes.push({
						tenant_id,
						fluxo_id,
						chave: 'MENSAGEM_FINALIZACAO',
						valor: mensagem_finalizacao,
					});
				}
			}

			// Atualizar ou adicionar mensagem_invalida se fornecida
			// Se não fornecida, usa o valor padrão já definido em configuracoes acima
			if (mensagem_invalida) {
				const index = configuracoes.findIndex(c => c.chave === 'MENSAGEM_INVALIDA');
				if (index >= 0) {
					configuracoes[index].valor = mensagem_invalida;
				} else {
					configuracoes.push({
						tenant_id,
						fluxo_id,
						chave: 'MENSAGEM_INVALIDA',
						valor: mensagem_invalida,
					});
				}
			}

			await this.prisma.fluxoConfiguracao.createMany({
				data: configuracoes,
				skipDuplicates: true, // Evita erros se já existir
			});

			console.log(`Configurações padrão criadas para fluxo ${fluxo_id}`);
		} catch (error) {
			console.error('Erro ao criar configuração default:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao criar configuração default');
		}
	}

	private async responseFluxoEnginer(
		etapa: Awaited<ReturnType<typeof this.etapaService.getEtapaInicio>>,
		{
			etapa_id,
			fluxo_id,
			ticket_id,
			variavel_id,
		}: { etapa_id: string; fluxo_id: string; ticket_id: string; variavel_id?: string | null },
	) {
		const interacoes = etapa.interacoes;
		if (!interacoes) {
			console.log(`[FluxoService] Etapa ${etapa_id} não possui interações. Retornando estrutura vazia.`);
			return {
				etapa_id,
				fluxo_id,
				ticket_id,
				conteudo: {
					mensagem: [],
				},
			};
		}

		const processadoresConteudo: Record<InteracaoTipo, () => Promise<any> | any> = {
			MENSAGEM: () => ({
				mensagem: interacoes.conteudo || '',
			}),
			IMAGEM: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'imagem',
				},
			}),
			AUDIO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'audio',
				},
			}),
			VIDEO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'video',
				},
			}),
			ARQUIVO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'arquivo',
				},
			}),
			BOTAO: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			SETAR_VARIAVEL: async () => {
				// Priorizar variavel_id da etapa, depois dos metadados da interação
				const metadados = interacoes.metadados as Record<string, any> | null | undefined;
				const variavelId = variavel_id || (metadados?.variavel_id as string | undefined);
				if (!variavelId) {
					return {
						mensagem: interacoes.conteudo || '',
					};
				}

				// Usar informações da variável que já vêm da etapa (se disponível)
				const variavelInfo = (etapa as any).variavel;
				if (variavelInfo) {
					return {
						mensagem: interacoes.conteudo || '',
						variavel_id: variavelId,
						regex: variavelInfo.regex,
						mensagem_erro: variavelInfo.mensagem_erro,
					};
				}

				// Fallback: buscar do core se não vier da etapa (para compatibilidade)
				try {
					const variavelResponse = await api_core.get(`/variaveis/${variavelId}`);
					const variavel = variavelResponse.data;

					return {
						mensagem: interacoes.conteudo || '',
						variavel_id: variavelId,
						regex: variavel?.mascara_variaveis?.regex || null,
						mensagem_erro: variavel?.mascara_variaveis?.mensagem_erro || null,
					};
				} catch (error) {
					console.error('Erro ao buscar variável do core:', error);
					return {
						mensagem: interacoes.conteudo || '',
						variavel_id: variavelId,
					};
				}
			},
			OBTER_VARIAVEL: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			API: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			DB: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
		};

		const processador = processadoresConteudo[interacoes.tipo];
		console.log(`[FluxoService] Tipo de interação: ${interacoes.tipo}, tem processador: ${!!processador}`);
		
		const conteudo = processador ? await (processador() as Promise<any>) : {};
		console.log(`[FluxoService] Conteúdo processado:`, JSON.stringify(conteudo, null, 2));

		const resultado = {
			etapa_id,
			fluxo_id,
			ticket_id,
			conteudo,
		};
		
		console.log(`[FluxoService] Resultado final do responseFluxoEnginer:`, JSON.stringify(resultado, null, 2));
		return resultado;
	}

	private async executarAcaoRegra(
		regraEncontrada: CondicaoRegra | null,
		fluxo_id: string,
		etapa_id: string,
	) {
		const data: {
			etapa_id: string;
			fluxo_id: string;
			queue_id: string;
			user_id: string;
			variavel_id?: string;
			regex?: string | null;
			mensagem_erro?: string | null;
			conteudo: {
				mensagem: never[];
				variavel_id?: string;
				regex?: string | null;
				mensagem_erro?: string | null;
			};
		} = {
			etapa_id: '',
			fluxo_id,
			queue_id: '',
			user_id: '',
			conteudo: {
				mensagem: [],
			},
		};

		// se nenhuma regra válida encontrada, retorna resposta inválida
		if (!regraEncontrada) {
			const etapa = await this.etapaService.findById(etapa_id);

			// Quando não encontra regra válida, retorna APENAS a mensagem de não entendido
			// Não deve incluir o conteúdo da interação, pois isso pode estar retornando a descrição
			const mensagemInvalida = this.normalizarParaString(
				await this.configService.getInvalidResponseMessage(etapa_id),
			);
			if (mensagemInvalida.trim() !== '') {
				data.conteudo.mensagem.push(mensagemInvalida as never);
			}

			// Verificar se a etapa tem variavel_id configurado
			const interacao = etapa.interacoes?.[0];
			const metadados = interacao?.metadados as Record<string, any> | null | undefined;
			const variavelIdEtapa = etapa.variavel_id;
			const variavelIdInteracao = metadados?.variavel_id as string | undefined;
			const variavelId = variavelIdEtapa || variavelIdInteracao;

			if (variavelId) {
				data.conteudo.variavel_id = variavelId;

				// Usar informações da variável que já vêm da etapa (se disponível)
				const variavelInfo = (etapa as any).variavel;
				if (variavelInfo) {
					data.conteudo.regex = variavelInfo.regex;
					data.conteudo.mensagem_erro = variavelInfo.mensagem_erro;
				}
			}

			data.etapa_id = etapa_id;
			return data;
		}

		// processa a ação da regra encontrada
		const acao = await this.configService.verificarRegra(regraEncontrada);

		// Processar variavel_id da regra (se existir) - ANTES de processar outras ações para garantir que seja preservada
		if (regraEncontrada?.variavel_id) {
			try {
				const variavelResponse = await api_core.get(`variaveis/${regraEncontrada.variavel_id}`);
				const variavel = variavelResponse.data;

				data.variavel_id = regraEncontrada.variavel_id;
				data.regex = variavel?.mascara_variaveis?.regex || null;
				data.mensagem_erro = variavel?.mascara_variaveis?.mensagem_erro || null;

				data.conteudo.variavel_id = regraEncontrada.variavel_id;
				data.conteudo.regex = variavel?.mascara_variaveis?.regex || null;
				data.conteudo.mensagem_erro = variavel?.mascara_variaveis?.mensagem_erro || null;
			} catch (error) {
				console.error(
					'Erro ao buscar variável do core:',
					error instanceof AxiosError ? error.response?.data : error,
				);
				data.variavel_id = regraEncontrada.variavel_id;
				data.conteudo.variavel_id = regraEncontrada.variavel_id;
			}
		}

		// Se a ação for SETAR_VARIAVEL ou OBTER_VARIAVEL, manter na mesma etapa
		if (
			regraEncontrada.action === 'SETAR_VARIAVEL' ||
			regraEncontrada.action === 'OBTER_VARIAVEL'
		) {
			data.etapa_id = etapa_id;
			const interacoes = await this.etapaService.getInteracoesByEtapaId(etapa_id);
			const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
			// Preservar variavel_id da regra se já foi definida
			const variavelIdRegra = data.conteudo.variavel_id;
			const regexRegra = data.conteudo.regex;
			const mensagemErroRegra = data.conteudo.mensagem_erro;
			data.conteudo = {
				mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
				...(variavelIdRegra && {
					variavel_id: variavelIdRegra,
					regex: regexRegra,
					mensagem_erro: mensagemErroRegra,
				}),
			};
			return data;
		}

		// Verificar se acao existe antes de acessar suas propriedades
		if (!acao) {
			// Se não há ação definida, manter na mesma etapa
			data.etapa_id = etapa_id;
			const interacoes = await this.etapaService.getInteracoesByEtapaId(etapa_id);
			const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
			// Preservar variavel_id da regra se já foi definida
			const variavelIdRegra = data.conteudo.variavel_id;
			const regexRegra = data.conteudo.regex;
			const mensagemErroRegra = data.conteudo.mensagem_erro;
			data.conteudo = {
				mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
				...(variavelIdRegra && {
					variavel_id: variavelIdRegra,
					regex: regexRegra,
					mensagem_erro: mensagemErroRegra,
				}),
			};
			return data;
		}

		// Processar mudança de etapa
		if (acao.next_etapa_id) {
			data.etapa_id = acao.next_etapa_id;
			const etapa = await this.etapaService.findById(acao.next_etapa_id);
			const regra = etapa.condicao?.[0]?.regras?.[0];

			// Priorizar variavel_id da regra, depois da etapa
			const variavelIdRegra = regra?.variavel_id;
			const variavelIdEtapa = etapa.variavel?.id;
			const variavelId = variavelIdRegra || variavelIdEtapa;

			if (regra?.action === 'SETAR_VARIAVEL' && variavelId) {
				const interacao = etapa.interacoes;
				const conteudo = this.normalizarParaString(interacao?.conteudo);

				// Usar informações da variável que já vêm da etapa (se disponível)
				const variavelInfo = etapa.variavel;
				if (variavelInfo) {
					data.conteudo = {
						mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
						variavel_id: variavelId,
						regex: variavelInfo.regex,
						mensagem_erro: variavelInfo.mensagem_erro,
					};
				} else {
					// Fallback: buscar do core se não vier da etapa
					try {
						const variavelResponse = await api_core.get(`/variaveis/${variavelId}`);
						const variavel = variavelResponse.data;

						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelId,
							regex: variavel?.mascara_variaveis?.regex || null,
							mensagem_erro: variavel?.mascara_variaveis?.mensagem_erro || null,
						};
					} catch (error) {
						console.error('Erro ao buscar variável do core:', error);
						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelId,
						};
					}
				}
			} else {
				const interacoes = await this.etapaService.getInteracoesByEtapaId(acao.next_etapa_id);
				const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
				// Preservar variavel_id da etapa ou da regra se já foi definida
				const variavelIdFinal = variavelId || data.conteudo.variavel_id;
				const regexRegra = data.conteudo.regex;
				const mensagemErroRegra = data.conteudo.mensagem_erro;

				if (variavelIdFinal) {
					// Usar informações da variável que já vêm da etapa (se disponível)
					const variavelInfo = (etapa as any).variavel;
					if (variavelInfo) {
						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelIdFinal,
							regex: variavelInfo.regex || regexRegra || null,
							mensagem_erro: variavelInfo.mensagem_erro || mensagemErroRegra || null,
						};
					} else {
						// Fallback: buscar do core se não vier da etapa
						try {
							const variavelResponse = await api_core.get(`/variaveis/${variavelIdFinal}`);
							const variavel = variavelResponse.data;
							data.conteudo = {
								mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
								variavel_id: variavelIdFinal,
								regex: variavel?.mascara_variaveis?.regex || regexRegra || null,
								mensagem_erro:
									variavel?.mascara_variaveis?.mensagem_erro || mensagemErroRegra || null,
							};
						} catch (error) {
							console.error('Erro ao buscar variável do core:', error);
							data.conteudo = {
								mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
								variavel_id: variavelIdFinal,
								regex: regexRegra,
								mensagem_erro: mensagemErroRegra,
							};
						}
					}
				} else {
					data.conteudo = {
						mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
						...(data.conteudo.variavel_id && {
							variavel_id: data.conteudo.variavel_id,
							regex: regexRegra,
							mensagem_erro: mensagemErroRegra,
						}),
					};
				}
			}
		}

		// Processar mudança de fluxo
		if (acao && acao.next_fluxo_id) {
			data.fluxo_id = acao.next_fluxo_id;

			const etapaInicio = await this.etapaService.getEtapaInicio(acao.next_fluxo_id);
			const etapa = await this.etapaService.findById(etapaInicio.id);
			const interacao = etapa.interacoes?.[0];

			// Priorizar variavel_id da etapa, depois dos metadados da interação
			const metadados = interacao?.metadados as Record<string, any> | null | undefined;
			const variavelIdEtapa = etapa.variavel_id;
			const variavelIdInteracao = metadados?.variavel_id as string | undefined;
			const variavelId = variavelIdEtapa || variavelIdInteracao;

			if (interacao?.tipo === 'SETAR_VARIAVEL' && variavelId) {
				const conteudo = this.normalizarParaString(interacao.conteudo);

				// Usar informações da variável que já vêm da etapa (se disponível)
				const variavelInfo = (etapa as any).variavel;
				if (variavelInfo) {
					data.conteudo = {
						mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
						variavel_id: variavelId,
						regex: variavelInfo.regex,
						mensagem_erro: variavelInfo.mensagem_erro,
					};
				} else {
					// Fallback: buscar do core se não vier da etapa
					try {
						const variavelResponse = await api_core.get(`/variaveis/${variavelId}`);
						const variavel = variavelResponse.data;

						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelId,
							regex: variavel?.mascara_variaveis?.regex || null,
							mensagem_erro: variavel?.mascara_variaveis?.mensagem_erro || null,
						};
					} catch (error) {
						console.error('Erro ao buscar variável do core:', error);
						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelId,
						};
					}
				}
			} else {
				const interacoes = await this.etapaService.getInteracoesByEtapaId(etapaInicio.id);
				const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
				// Preservar variavel_id da etapa ou da regra se já foi definida
				const variavelIdFinal = variavelId || data.conteudo.variavel_id;
				const regexRegra = data.conteudo.regex;
				const mensagemErroRegra = data.conteudo.mensagem_erro;

				if (variavelIdFinal) {
					// Usar informações da variável que já vêm da etapa (se disponível)
					const variavelInfo = (etapa as any).variavel;
					if (variavelInfo) {
						data.conteudo = {
							mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
							variavel_id: variavelIdFinal,
							regex: variavelInfo.regex || regexRegra || null,
							mensagem_erro: variavelInfo.mensagem_erro || mensagemErroRegra || null,
						};
					} else {
						// Fallback: buscar do core se não vier da etapa
						try {
							const variavelResponse = await api_core.get(`/variaveis/${variavelIdFinal}`);
							const variavel = variavelResponse.data;
							data.conteudo = {
								mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
								variavel_id: variavelIdFinal,
								regex: variavel?.mascara_variaveis?.regex || regexRegra || null,
								mensagem_erro:
									variavel?.mascara_variaveis?.mensagem_erro || mensagemErroRegra || null,
							};
						} catch (error) {
							console.error('Erro ao buscar variável do core:', error);
							data.conteudo = {
								mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
								variavel_id: variavelIdFinal,
								regex: regexRegra,
								mensagem_erro: mensagemErroRegra,
							};
						}
					}
				} else {
					data.conteudo = {
						mensagem: conteudo.trim() !== '' ? ([conteudo] as never[]) : [],
						...(data.conteudo.variavel_id && {
							variavel_id: data.conteudo.variavel_id,
							regex: regexRegra,
							mensagem_erro: mensagemErroRegra,
						}),
					};
				}
			}
			data.etapa_id = etapaInicio.id;
		}

		// Processar atribuição de fila ou usuário
		if (acao && (acao.queue_id || acao.user_id)) {
			let mensagem_encaminhamento = '';
			let mensagem_fora_horario = '';
			const mensagem: string[] = [];

			if (acao.queue_id && !acao.user_id) {
				data.queue_id = acao.queue_id;
				mensagem_encaminhamento = await this.configService.getSendMessageQueue(acao.queue_id);
				mensagem_fora_horario = await this.configService.getSendMessageOutOfHour(acao.queue_id);
			} else if (acao.user_id) {
				data.user_id = acao.user_id;
				data.queue_id = acao.queue_id;
				mensagem_encaminhamento = await this.configService.getSendMessageDefault(fluxo_id);
			}

			// Normalizar e adiciona apenas mensagens não vazias ao array
			const msgForaHorarioNormalizada = this.normalizarParaString(mensagem_fora_horario);
			if (msgForaHorarioNormalizada.trim() !== '') {
				mensagem.push(msgForaHorarioNormalizada);
			}

			const msgEncaminhamentoNormalizada = this.normalizarParaString(mensagem_encaminhamento);
			if (msgEncaminhamentoNormalizada.trim() !== '') {
				mensagem.push(msgEncaminhamentoNormalizada);
			}

			// Preservar variavel_id, regex e mensagem_erro se já foram definidos
			const variavelIdRegra = data.conteudo.variavel_id;
			const regexRegra = data.conteudo.regex;
			const mensagemErroRegra = data.conteudo.mensagem_erro;
			data.conteudo = {
				mensagem: mensagem as never[],
				...(variavelIdRegra && { variavel_id: variavelIdRegra }),
				...(regexRegra !== undefined && { regex: regexRegra }),
				...(mensagemErroRegra !== undefined && {
					mensagem_erro: mensagemErroRegra,
				}),
			};
		}

		return data;
	}

	// Método auxiliar para extrair nome do arquivo da URL
	private extrairNomeArquivo(url: string | null): string {
		if (!url) return '';
		return url.split('/').pop() || '';
	}

	private extrairMensagem(conteudo: any): string {
		if (conteudo.mensagem) return conteudo.mensagem;
		if (conteudo.file) return conteudo.file.nome;
		return '';
	}

	// Método auxiliar para converter valor para string de forma segura
	private normalizarParaString(valor: any): string {
		if (valor === null || valor === undefined) return '';
		if (typeof valor === 'string') {
			// Se já for uma string, retorna direto
			return valor;
		}
		if (typeof valor === 'object') {
			// Se for um objeto, tenta pegar uma propriedade comum como 'resposta', 'mensagem', 'texto', ou 'valor'
			const textoExtraido = valor.resposta || valor.mensagem || valor.texto || valor.valor;
			if (textoExtraido && typeof textoExtraido === 'string') {
				return textoExtraido;
			}
			// Se não encontrou propriedade com string, retorna vazio ao invés de stringify
			return '';
		}
		return String(valor);
	}

	/**
	 * Obter configurações de expiração (TTL) do fluxo
	 * Retorna configurações de expiração para triagem e NPS
	 */
	async getExpiracaoConfig(fluxo_id: string) {
		const configuracoes = await this.prisma.fluxoConfiguracao.findMany({
			where: {
				fluxo_id,
				chave: {
					in: [
						'EXPIRACAO_TRIAGEM_HABILITADA',
						'EXPIRACAO_TRIAGEM_MINUTOS',
						'EXPIRACAO_TRIAGEM_MENSAGEM',
						'EXPIRACAO_NPS_HABILITADA',
						'EXPIRACAO_NPS_HORAS',
						'EXPIRACAO_NPS_MENSAGEM',
						'EXPIRACAO_NPS_SILENCIOSO',
					],
				},
			},
		});

		// Criar um mapa para facilitar o acesso aos valores
		const configMap = new Map(
			configuracoes.map((config) => [config.chave, config.valor]),
		);

		// Helper para pegar valor com fallback
		const getConfig = (chave: string, defaultValue: string = ''): string => {
			return configMap.get(chave as any) || defaultValue;
		};

		// Retornar em formato estruturado
		return {
			triagem: {
				habilitada: getConfig('EXPIRACAO_TRIAGEM_HABILITADA', 'false') === 'true',
				minutos: parseInt(getConfig('EXPIRACAO_TRIAGEM_MINUTOS', '0')),
				mensagem: getConfig('EXPIRACAO_TRIAGEM_MENSAGEM', ''),
			},
			nps: {
				habilitada: getConfig('EXPIRACAO_NPS_HABILITADA', 'false') === 'true',
				horas: parseInt(getConfig('EXPIRACAO_NPS_HORAS', '0')),
				mensagem: getConfig('EXPIRACAO_NPS_MENSAGEM', ''),
				silencioso: getConfig('EXPIRACAO_NPS_SILENCIOSO', 'false') === 'true',
			},
		};
	}
}
