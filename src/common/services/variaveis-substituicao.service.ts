import { Injectable, Logger } from '@nestjs/common';
import { api_core } from 'src/infra/config/axios/core';

@Injectable()
export class VariaveisSubstituicaoService {
	private readonly logger = new Logger(VariaveisSubstituicaoService.name);

	async buscarMapaVariaveis(
		contato_id: string,
		tenant_id: string,
	): Promise<Record<string, string>> {
		try {
			const { data } = await api_core.get('/contato-variaveis/mapa', {
				params: { contato_id, tenant_id },
			});
			return data || {};
		} catch (error: any) {
			this.logger.warn(`Erro ao buscar mapa de variáveis: ${error.message}`);
			return {};
		}
	}

	private normalizarNomeVariavel(nome: string): string {
		return nome.toLowerCase().replace(/\s+/g, '_');
	}

	substituir(mensagem: string, variaveis: Record<string, string>): string {
		return mensagem.replace(/\{\{(\w+)\}\}/g, (match, nome) => {
			const chaveNormalizada = this.normalizarNomeVariavel(nome);
			return variaveis[chaveNormalizada] ?? match;
		});
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

		// Inicializar mapa com variáveis de sistema
		const variaveis: Record<string, string> = {
			ticket_id: ticket_id,
			protocolo: ticket_id,
		};

		// Buscar variáveis do contato se tiver contato_id e tenant_id
		if (contato_id && tenant_id) {
			const variaveisContato = await this.buscarMapaVariaveis(contato_id, tenant_id);
			Object.assign(variaveis, variaveisContato);
		}

		this.logger.log(`[processarMensagens] Variáveis disponíveis: ${JSON.stringify(Object.keys(variaveis))}`);

		// Substituir variáveis em todas as mensagens
		return mensagens.map((msg) => this.substituir(msg, variaveis));
	}
}