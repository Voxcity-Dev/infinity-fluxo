import { Injectable, Logger } from '@nestjs/common';

/**
 * Serviço de cache em memória para variáveis de contatos de teste.
 * Usado APENAS para testes de fluxo no frontend, não afeta canais reais.
 */
@Injectable()
export class TestVariablesCacheService {
	private readonly logger = new Logger(TestVariablesCacheService.name);
	private cache = new Map<string, Map<string, string>>();

	/**
	 * Verifica se um ticket_id é de teste
	 */
	private isTestTicket(ticket_id: string): boolean {
		return ticket_id.startsWith('test-');
	}

	/**
	 * Gera chave única para o contato no cache
	 */
	private getCacheKey(contato_id: string, tenant_id: string): string {
		return `${tenant_id}:${contato_id}`;
	}

	/**
	 * Salva uma variável no cache (apenas para testes)
	 */
	setVariable(
		contato_id: string,
		tenant_id: string,
		ticket_id: string,
		variavel_nome: string,
		valor: string,
	): void {
		this.logger.log(`[Cache] setVariable chamado - contato=${contato_id.substring(0, 8)}..., ticket=${ticket_id}, variavel="${variavel_nome}", valor="${valor}"`);

		if (!this.isTestTicket(ticket_id)) {
			this.logger.warn(`[Cache] Ticket NÃO é de teste - não salvando no cache`);
			return; // Não cachear se não for teste
		}

		const key = this.getCacheKey(contato_id, tenant_id);
		const variavel_normalizada = this.normalizarNomeVariavel(variavel_nome);

		this.logger.log(`[Cache] Chave do cache: ${key}, variavel normalizada: ${variavel_normalizada}`);

		if (!this.cache.has(key)) {
			this.logger.log(`[Cache] Criando novo Map para contato ${contato_id.substring(0, 8)}...`);
			this.cache.set(key, new Map());
		}

		const contatoVars = this.cache.get(key)!;
		contatoVars.set(variavel_normalizada, valor);

		this.logger.log(
			`[Cache] Variável salva em memória: contato=${contato_id.substring(0, 8)}..., variavel=${variavel_normalizada}, valor="${valor}"`,
		);
		this.logger.log(`[Cache] Estado atual do cache para este contato:`, Object.fromEntries(contatoVars));
	}

	/**
	 * Busca todas as variáveis de um contato no cache
	 */
	getVariables(
		contato_id: string,
		tenant_id: string,
		ticket_id: string,
	): Record<string, string> {
		this.logger.log(`[Cache] getVariables chamado - contato=${contato_id.substring(0, 8)}..., ticket=${ticket_id}`);

		if (!this.isTestTicket(ticket_id)) {
			this.logger.warn(`[Cache] Ticket NÃO é de teste - retornando vazio`);
			return {}; // Retornar vazio se não for teste
		}

		const key = this.getCacheKey(contato_id, tenant_id);
		this.logger.log(`[Cache] Buscando variáveis com chave: ${key}`);

		const contatoVars = this.cache.get(key);

		if (!contatoVars) {
			this.logger.log(`[Cache] Nenhuma variável encontrada para contato=${contato_id.substring(0, 8)}...`);
			this.logger.log(`[Cache] Chaves disponíveis no cache:`, Array.from(this.cache.keys()));
			return {};
		}

		const vars = Object.fromEntries(contatoVars);
		this.logger.log(
			`[Cache] Variáveis encontradas para contato=${contato_id.substring(0, 8)}...: ${JSON.stringify(Object.keys(vars))}`,
		);
		this.logger.log(`[Cache] Mapa completo de variáveis:`, vars);

		return vars;
	}

	/**
	 * Limpa variáveis de um contato específico
	 */
	clearContact(contato_id: string, tenant_id: string): void {
		const key = this.getCacheKey(contato_id, tenant_id);
		this.cache.delete(key);
		this.logger.log(`[Cache] Variáveis limpas para contato=${contato_id.substring(0, 8)}...`);
	}

	/**
	 * Limpa todo o cache (útil para testes)
	 */
	clearAll(): void {
		this.cache.clear();
		this.logger.log('[Cache] Todo o cache de variáveis de teste foi limpo');
	}

	/**
	 * Normaliza nome de variável (mesmo padrão do core)
	 */
	private normalizarNomeVariavel(nome: string): string {
		return nome.toLowerCase().replace(/\s+/g, '_');
	}

	/**
	 * Retorna estatísticas do cache
	 */
	getStats(): { totalContacts: number; totalVariables: number } {
		let totalVariables = 0;
		for (const vars of this.cache.values()) {
			totalVariables += vars.size;
		}

		return {
			totalContacts: this.cache.size,
			totalVariables,
		};
	}
}
