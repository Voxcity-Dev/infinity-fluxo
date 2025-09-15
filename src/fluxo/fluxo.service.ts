import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import { FluxoEngineInput, ListFluxosInput } from './dto/list-fluxo.dto';
import { Etapas, FluxoConfiguracaoChave } from '@prisma/client';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { EtapaService } from 'src/etapa/etapa.service';
import { CondicaoRegra, InteracaoTipo } from 'src/schemas';
import { CondicaoService } from 'src/condicao/condicao.service';
import { ConfigService } from 'src/common/services/config.service';

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

			const fluxos = await this.prisma.fluxo.findMany({
				where: {
					tenant_id,
					nome: {
						contains: search,
					},
					is_deleted: false,
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

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

	async update(data: { id: string; nome?: string }) {
		try {
			const { id, nome } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};
			
			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}

			// Verificar se há pelo menos um campo para atualizar
			if (Object.keys(updateData).length === 0) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			const fluxo = await this.prisma.fluxo.update({
				where: { 
					id,
					is_deleted: false // Garantir que não atualize fluxos deletados
				},
				data: updateData,
			});

			return fluxo;
		} catch (error) {
			console.error('Erro ao atualizar fluxo:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao atualizar fluxo');
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
			const configuracoes = Object.entries(this.configService.configuracaoDefaults).map(([chave, valor]) => ({
				tenant_id,
				fluxo_id,
				chave: chave as FluxoConfiguracaoChave,
				valor
			}));

			if (mensagem_finalizacao) {
				configuracoes.push({
					tenant_id,
					fluxo_id,
					chave: 'MENSAGEM_FINALIZACAO' as FluxoConfiguracaoChave,
					valor: mensagem_finalizacao,
				});
			}

			if (mensagem_invalida) {
				configuracoes.push({
					tenant_id,
					fluxo_id,
					chave: 'MENSAGEM_INVALIDA' as FluxoConfiguracaoChave,
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
				mensagem: '',
			},
		};

		// se nenhuma regra válida encontrada, retorna resposta inválida
		if (!regraEncontrada) {
			console.log('Nenhuma regra válida encontrada');
			data.conteudo.mensagem = await this.configService.getInvalidResponseMessage(etapa_id);
			data.etapa_id = etapa_id;
			return data;
		}

		// processa a ação da regra encontrada
		const acao = await this.configService.verificarRegra(regraEncontrada);

		// Processar mudança de etapa
		if (acao.next_etapa_id) {
			data.etapa_id = acao.next_etapa_id;
			const interacoes = await this.etapaService.getInteracoesByEtapaId(acao.next_etapa_id);
			data.conteudo = { mensagem: interacoes[0]?.conteudo || '' };
		}

		// Processar mudança de fluxo
		if (acao.next_fluxo_id) {
			data.fluxo_id = acao.next_fluxo_id;
			
			const etapaInicio = await this.etapaService.getEtapaInicio(acao.next_fluxo_id);
			const interacoes = await this.etapaService.getInteracoesByEtapaId(etapaInicio.id);
			
			data.conteudo = { mensagem: interacoes[0]?.conteudo || '' };
			data.etapa_id = etapaInicio.id;
			data.conteudo = { mensagem: interacoes[0]?.conteudo || '' };
		}

		// Processar atribuição de fila ou usuário
		if (acao.queue_id || acao.user_id) {
			if (acao.queue_id) data.queue_id = acao.queue_id;
			else if (acao.user_id) data.user_id = acao.user_id;
			data.conteudo = { mensagem: await this.configService.getSendMessage(fluxo_id) };
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
}