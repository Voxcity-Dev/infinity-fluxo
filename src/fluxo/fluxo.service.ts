import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import { FluxoEngineInput, ListFluxosInput } from './dto/list-fluxo.dto';
import { Etapas, FluxoConfiguracaoChave } from '@prisma/client';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { EtapaService } from 'src/etapa/etapa.service';
import { InteracaoTipo } from 'src/schemas';

@Injectable()
export class FluxoService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly etapaService: EtapaService,
	) {}

	async engine(data: FluxoEngineInput) {
		try {
			const { etapa_id, fluxo_id, conteudo, ticket_id } = data;

			if (!etapa_id) {
				const etapa = await this.etapaService.getEtapaInicio(fluxo_id);
				return this.responseFluxoEnginer(etapa, { etapa_id: etapa.id, fluxo_id, ticket_id });
			}

			// return this.responseFluxoEnginer(data, { etapa_id, fluxo_id, ticket_id });
			
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
				},
			});

			// Criar configurações padrão após criar o fluxo
			await this.configuracaoDefault(data.tenant_id, fluxo.id);

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

	private readonly configuracaoDefaults = {
		SEND_MESSAGE: 'Seu atendimento foi encaminhado para a fila! Aguarde a resposta do atendente.',
		INVALID_RESPONSE_MESSAGE: 'Desculpe, não entendi sua resposta. Poderia repetir?',
		TIMEOUT_MINUTES: 'NONE',
		QUEUE_DEFAULT: '',
		USER_DEFAULT: '',
		MAX_RETRIES: '3',
		AUTO_ASSIGNMENT: 'NONE', // NONE, RANDOM, BALANCED
		END_FLOW_ON_CONDITION: 'encerrar'
	} as const;

	private async configuracaoDefault(tenant_id: string, fluxo_id: string) {
		try {
			// Criar todas as configurações de uma vez
			const configuracoes = Object.entries(this.configuracaoDefaults).map(([chave, valor]) => ({
				tenant_id,
				fluxo_id,
				chave: chave as FluxoConfiguracaoChave,
				valor
			}));

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

		// Mapear tipo de interação para função de processamento
		const processadoresConteudo: Record<InteracaoTipo, () => any> = {
			MESSAGE: () => ({
				mensagem: interacoes.conteudo || '',
			}),
			IMAGE: () => ({
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
			FILE: () => ({
				file: {
					nome: this.extrairNomeArquivo(interacoes.url_midia),
					url: interacoes.url_midia || '',
					tipo: 'arquivo'
				}
			}),
			BUTTON: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			SET_VARIABLE: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			GET_VARIABLE: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			API_CALL: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
			DB_QUERY: () => ({
				mensagem: JSON.stringify(interacoes.metadados) || '',
			}),
		};

		// Processar conteúdo baseado no tipo
		const conteudo = processadoresConteudo[interacoes.tipo]?.() || {};

		return {
			etapa_id,
			fluxo_id,
			ticket_id,
			conteudo,
		};
	}

	// Método auxiliar para extrair nome do arquivo da URL
	private extrairNomeArquivo(url: string | null): string {
		if (!url) return '';
		return url.split('/').pop() || '';
	}
}