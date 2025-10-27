import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import { FluxoEngineInput, ListFluxosInput } from './dto/list-fluxo.dto';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { EtapaService } from 'src/etapa/etapa.service';
import { CondicaoRegra, InteracaoTipo } from 'src/schemas';
import { CondicaoService } from 'src/condicao/condicao.service';
import { ConfigService } from 'src/common/services/config.service';
import { FlowConfiguracaoChave } from 'src/schemas/fluxo.schema';

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
			const { etapa_id, fluxo_id, conteudo, ticket_id } = data;

			if (!etapa_id) {
				const etapa = await this.etapaService.getEtapaInicio(fluxo_id);
				return this.responseFluxoEnginer(etapa, { etapa_id: etapa.id, fluxo_id, ticket_id });
			}

			const mensagem = this.extrairMensagem(conteudo);

			// Buscar regra válida
			const regraEncontrada = await this.condicaoService.buscarRegraValida(etapa_id, mensagem, ticket_id, fluxo_id);
			
			// Executar ação da regra
			const resultado = await this.executarAcaoRegra(regraEncontrada, fluxo_id, etapa_id);

			return {
				etapa_id: resultado.etapa_id,
				conteudo: resultado.conteudo,
				fluxo_id: resultado.fluxo_id || fluxo_id,
				ticket_id,
				queue_id: resultado.queue_id,
				user_id: resultado.user_id,
			}
			
		} catch (error) {
			console.error('Erro ao executar fluxo:', error);

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
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const fluxos = await this.prisma.fluxo.findMany(queryOptions);

			return fluxos;
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
					is_deleted: false // Garantir que não retorne fluxos deletados
				},
			});

			if (!fluxo) {
				throw new NotFoundException('Fluxo não encontrado');
			}

			return fluxo;
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
			await this.configuracaoDefault(data.tenant_id, fluxo.id, data.mensagem_finalizacao, data.mensagem_invalida);

			return fluxo;
		} catch (error) {
			console.error('Erro ao criar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao criar fluxo');
		}
	}

	async update(data: { id: string; nome?: string; descricao?: string; mensagem_finalizacao?: string; mensagem_invalida?: string }) {
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
						is_deleted: false // Garantir que não atualize fluxos deletados
					},
					data: updateData,
				});
			}

			// Atualizar mensagens se fornecidas
			if (mensagem_finalizacao || mensagem_invalida) {
				await this.updateMensagens({
					fluxo_id: id,
					mensagem_finalizacao,
					mensagem_invalida
				});
			}

			// Se não atualizou dados básicos, buscar o fluxo atual
			if (!fluxo) {
				fluxo = await this.prisma.fluxo.findFirst({
					where: { 
						id,
						is_deleted: false
					}
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

	async updateMensagens(data: { fluxo_id: string; mensagem_finalizacao?: string; mensagem_invalida?: string }) {
		try {
			const { fluxo_id, mensagem_finalizacao, mensagem_invalida } = data;

			// Verificar se o fluxo existe
			const fluxo = await this.prisma.fluxo.findFirst({
				where: { 
					id: fluxo_id,
					is_deleted: false
				}
			});

			if (!fluxo) {
				throw new NotFoundException('Fluxo não encontrado');
			}

			// Atualizar mensagem de finalização se fornecida
			if (mensagem_finalizacao !== undefined && mensagem_finalizacao !== null && mensagem_finalizacao !== '') {
				const configExistente = await this.prisma.fluxoConfiguracao.findFirst({
					where: {
						fluxo_id,
						chave: 'MENSAGEM_FINALIZACAO'
					}
				});

				if (configExistente) {
					await this.prisma.fluxoConfiguracao.update({
						where: { id: configExistente.id },
						data: { valor: mensagem_finalizacao }
					});
				} else {
					await this.prisma.fluxoConfiguracao.create({
						data: {
							tenant_id: fluxo.tenant_id,
							fluxo_id,
							chave: 'MENSAGEM_FINALIZACAO',
							valor: mensagem_finalizacao
						}
					});
				}
			}

			// Atualizar mensagem inválida se fornecida
			if (mensagem_invalida !== undefined && mensagem_invalida !== null && mensagem_invalida !== '') {
				const configExistente = await this.prisma.fluxoConfiguracao.findFirst({
					where: {
						fluxo_id,
						chave: 'MENSAGEM_INVALIDA'
					}
				});

				if (configExistente) {
					await this.prisma.fluxoConfiguracao.update({
						where: { id: configExistente.id },
						data: { valor: mensagem_invalida }
					});
				} else {
					await this.prisma.fluxoConfiguracao.create({
						data: {
							tenant_id: fluxo.tenant_id,
							fluxo_id,
							chave: 'MENSAGEM_INVALIDA',
							valor: mensagem_invalida
						}
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
				where: { id: fluxo_id, },
				data: { is_deleted: true, },
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
			const configuracoesValidas = configuracoes.filter(config => 
				config.valor !== undefined && 
				config.valor !== null && 
				config.valor !== ''
			);

			if (configuracoesValidas.length === 0) {
				throw new BadRequestException('Nenhuma configuração válida fornecida para atualização');
			}
			
			// Usar transação para garantir consistência
			const resultados = await this.prisma.$transaction(
				configuracoesValidas.map((config) =>
					this.prisma.fluxoConfiguracao.update({
						where: { id: config.id },
						data: { valor: config.valor },
					})
				)
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
					chave: 'MENSAGEM_INVALIDA' 
				},
			});
			
			return configuracao?.valor || this.configService.configuracaoDefaults.MENSAGEM_INVALIDA;
		} catch (error) {
			console.error('Erro ao obter mensagem de resposta inválida:', error);
			return this.configService.configuracaoDefaults.MENSAGEM_INVALIDA;
		}
	}

	private async configuracaoDefault(tenant_id: string, fluxo_id: string, mensagem_finalizacao?: string, mensagem_invalida?: string) {
		try {
			// Criar todas as configurações de uma vez
			const configuracoes: Array<{
				tenant_id: string;
				fluxo_id: string;
				chave: FlowConfiguracaoChave;
				valor: string;
			}> = Object.entries(this.configService.configuracaoDefaults).map(([chave, valor]) => ({
				tenant_id,
				fluxo_id,
				chave: chave as FlowConfiguracaoChave,
				valor
			}));

			if (mensagem_finalizacao) {
				configuracoes.push({
					tenant_id,
					fluxo_id,
					chave: 'MENSAGEM_FINALIZACAO' as FlowConfiguracaoChave,
					valor: mensagem_finalizacao,
				});
			}

			if (mensagem_invalida) {
				configuracoes.push({
					tenant_id,
					fluxo_id,
					chave: 'MENSAGEM_INVALIDA' as FlowConfiguracaoChave,
					valor: mensagem_invalida,
				});
			}

			await this.prisma.fluxoConfiguracao.createMany({
				data: configuracoes,
				skipDuplicates: true // Evita erros se já existir
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

	private responseFluxoEnginer(
		{interacoes}: Awaited<ReturnType<typeof this.etapaService.getEtapaInicio>>, 
		{etapa_id, fluxo_id, ticket_id}: {etapa_id: string, fluxo_id: string, ticket_id: string}
	) {
		if (!interacoes) return null;

		const processadoresConteudo: Record<InteracaoTipo, () => any> = {
			MENSAGEM: () => ({
				mensagem: interacoes.conteudo || '',
			}),
			IMAGEM: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'imagem'
				}
			}),
			AUDIO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'audio'
				}
			}),
			VIDEO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'video'
				}
			}),
			ARQUIVO: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'arquivo'
				}
			}),
			BOTAO: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			SETAR_VARIAVEL: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
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

		const conteudo = processadoresConteudo[interacoes.tipo]?.() || {};

		return {
			etapa_id,
			fluxo_id,
			ticket_id,
			conteudo,
		};
	}

	private async executarAcaoRegra(regraEncontrada: CondicaoRegra | null, fluxo_id: string, etapa_id: string) {
		const data = {
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
			const interacoes = await this.etapaService.getInteracoesByEtapaId(etapa_id);
			
			const mensagemInvalida = this.normalizarParaString(await this.configService.getInvalidResponseMessage(etapa_id));
			if (mensagemInvalida.trim() !== '') {
				data.conteudo.mensagem.push(mensagemInvalida as never);
			}
			
			const conteudoInteracao = this.normalizarParaString(interacoes[0]?.conteudo);
			if (conteudoInteracao.trim() !== '') {
				data.conteudo.mensagem.push(conteudoInteracao as never);
			}
			
			data.etapa_id = etapa_id;
			return data;
		}

		// processa a ação da regra encontrada
		const acao = await this.configService.verificarRegra(regraEncontrada);

		// Processar mudança de etapa
		if (acao.next_etapa_id) {
			data.etapa_id = acao.next_etapa_id;
			const interacoes = await this.etapaService.getInteracoesByEtapaId(acao.next_etapa_id);
			const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
			data.conteudo = { mensagem: conteudo.trim() !== '' ? [conteudo] as never[] : [] };
		}

		// Processar mudança de fluxo
		if (acao.next_fluxo_id) {
			data.fluxo_id = acao.next_fluxo_id;
			
			const etapaInicio = await this.etapaService.getEtapaInicio(acao.next_fluxo_id);
			const interacoes = await this.etapaService.getInteracoesByEtapaId(etapaInicio.id);
			
			const conteudo = this.normalizarParaString(interacoes[0]?.conteudo);
			data.conteudo = { mensagem: conteudo.trim() !== '' ? [conteudo] as never[] : [] };
			data.etapa_id = etapaInicio.id;
		}

		// Processar atribuição de fila ou usuário
		if (acao.queue_id || acao.user_id) {
			let mensagem_encaminhamento = '';
			let mensagem_fora_horario = '';
			let mensagem: string[] = [];

			if (acao.queue_id && !acao.user_id) {
				data.queue_id = acao.queue_id
				mensagem_encaminhamento = await this.configService.getSendMessageQueue(acao.queue_id);
				mensagem_fora_horario = await this.configService.getSendMessageOutOfHour(acao.queue_id);
			}
			else if (acao.user_id) {
				data.user_id = acao.user_id
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
			
			data.conteudo = { mensagem: mensagem as never[] };
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
}