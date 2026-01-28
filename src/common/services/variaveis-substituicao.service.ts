import { Injectable, Logger } from '@nestjs/common';
import { api_core } from 'src/infra/config/axios/core';
import { TestVariablesCacheService } from './test-variables-cache.service';

@Injectable()
export class VariaveisSubstituicaoService {
	private readonly logger = new Logger(VariaveisSubstituicaoService.name);

	constructor(private readonly testCache: TestVariablesCacheService) {}

	/**
	 * Verifica se é um ticket de teste
	 */
	private isTestTicket(ticket_id: string): boolean {
		return ticket_id.startsWith('test-');
	}

	async buscarMapaVariaveis(
		contato_id: string,
		tenant_id: string,
		ticket_id: string,
	): Promise<Record<string, string>> {
		// Se for teste, buscar do cache em memória
		if (this.isTestTicket(ticket_id)) {
			this.logger.log(`[buscarMapaVariaveis] Ticket de TESTE detectado - buscando variáveis do cache em memória`);
			const cachedVars = this.testCache.getVariables(contato_id, tenant_id, ticket_id);
			this.logger.log(`[buscarMapaVariaveis] Variáveis do cache: ${JSON.stringify(cachedVars)}`);
			return cachedVars;
		}

		// Se não for teste, buscar normalmente da API
		try {
			this.logger.log(`[buscarMapaVariaveis] Ticket REAL - fazendo requisição GET /contato-variaveis/mapa - params: ${JSON.stringify({ contato_id, tenant_id })}`);
			const { data } = await api_core.get('/contato-variaveis/mapa', {
				params: { contato_id, tenant_id },
			});
			this.logger.log(`[buscarMapaVariaveis] Resposta da API recebida: ${JSON.stringify(data)}`);
			return data || {};
		} catch (error: any) {
			this.logger.error(`[buscarMapaVariaveis] Erro ao buscar mapa de variáveis: ${error.message}`);
			if (error.response) {
				this.logger.error(`[buscarMapaVariaveis] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
			}
			return {};
		}
	}

	private normalizarNomeVariavel(nome: string): string {
		return nome.toLowerCase().replace(/\s+/g, '_');
	}

	substituir(mensagem: string, variaveis: Record<string, string>): string {
		this.logger.log(`[substituir] Mensagem original: "${mensagem}"`);
		this.logger.log(`[substituir] Variáveis disponíveis: ${JSON.stringify(Object.keys(variaveis))}`);

		const resultado = mensagem.replace(/\{\{(\w+)\}\}/g, (match, nome) => {
			const chaveNormalizada = this.normalizarNomeVariavel(nome);
			const valor = variaveis[chaveNormalizada] ?? match;
			this.logger.log(`[substituir] Placeholder {{${nome}}} → normalizado: "${chaveNormalizada}" → valor: "${valor}"`);
			return valor;
		});

		this.logger.log(`[substituir] Mensagem processada: "${resultado}"`);
		return resultado;
	}

	async processarMensagens(
		mensagens: string[],
		contexto: {
			contato_id?: string;
			tenant_id?: string;
			ticket_id: string;
		},
	): Promise<string[]> {
		const { contato_id, tenant_id, ticket_id } = contexto;

		this.logger.log(`[processarMensagens] INÍCIO - Contexto recebido: ${JSON.stringify({ contato_id, tenant_id, ticket_id })}`);

		// Inicializar mapa com variáveis de sistema
		const variaveis: Record<string, string> = {
			ticket_id: ticket_id,
			protocolo: ticket_id,
		};

		// Buscar variáveis do contato se tiver contato_id e tenant_id
		if (contato_id && tenant_id) {
			this.logger.log(`[processarMensagens] Buscando variáveis do contato - contato_id: ${contato_id}, tenant_id: ${tenant_id}`);
			const variaveisContato = await this.buscarMapaVariaveis(contato_id, tenant_id, ticket_id);
			this.logger.log(`[processarMensagens] Variáveis do contato retornadas: ${JSON.stringify(variaveisContato)}`);
			Object.assign(variaveis, variaveisContato);
		} else {
			this.logger.warn(`[processarMensagens] Não foi possível buscar variáveis do contato - contato_id: ${contato_id}, tenant_id: ${tenant_id}`);
		}

		this.logger.log(`[processarMensagens] Variáveis disponíveis (total: ${Object.keys(variaveis).length}): ${JSON.stringify(Object.keys(variaveis))}`);
		this.logger.log(`[processarMensagens] Mapa completo de variáveis: ${JSON.stringify(variaveis)}`);

		// Substituir variáveis em todas as mensagens
		const mensagensProcessadas = mensagens.map((msg) => this.substituir(msg, variaveis));
		this.logger.log(`[processarMensagens] Mensagens processadas: ${JSON.stringify(mensagensProcessadas)}`);

		return mensagensProcessadas;
	}

	/**
	 * Salva uma variável (apenas para testes, não persiste no banco)
	 */
	salvarVariavelTeste(
		contato_id: string,
		tenant_id: string,
		ticket_id: string,
		variavel_nome: string,
		valor: string,
	): void {
		if (this.isTestTicket(ticket_id)) {
			this.testCache.setVariable(contato_id, tenant_id, ticket_id, variavel_nome, valor);
		}
	}
}
