import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { JSONPath } from 'jsonpath-plus';

export interface ApiStepConfig {
	request: {
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		url: string;
		headers?: Record<string, string>;
		body?: any;
	};
	response: {
		format: 'json';
		mapping?: Record<string, string>;
	};
	timeout?: number;
	retryOnFailure?: boolean;
	maxRetries?: number;
}

export interface StepContext {
	variables: Record<string, any>;
	tenant_id: string;
	etapa_id: string;
}

export interface ApiStepResult {
	status: number;
	statusText: string;
	raw: any;
	parsed?: Record<string, any>;
	error?: {
		message: string;
		code: string;
	};
	metadata: {
		url: string;
		method: string;
		timestamp: string;
		duration: number;
		attempts: number;
	};
}

@Injectable()
export class ApiStepExecutor {
	private readonly logger = new Logger(ApiStepExecutor.name);

	/**
	 * Executa a etapa de API com base na configuração fornecida
	 */
	async execute(config: ApiStepConfig, context: StepContext): Promise<ApiStepResult> {
		const startTime = Date.now();
		let attempts = 0;
		const maxAttempts = config.retryOnFailure ? config.maxRetries || 3 : 1;

		this.logger.log(
			`Executando etapa API [${context.etapa_id}] - Tenant: ${context.tenant_id} - URL: ${config.request.url}`,
		);

		this.logger.log(`[ApiStepExecutor] Variáveis disponíveis: ${JSON.stringify(Object.keys(context.variables))}`);
		this.logger.log(`[ApiStepExecutor] URL original: ${config.request.url}`);
		// 1. Resolver variáveis
		const resolvedUrl = this.resolveVariables(config.request.url, context.variables);
		const resolvedHeaders = this.resolveObjectVariables(config.request.headers, context.variables);
		const resolvedBody = this.resolveObjectVariables(config.request.body, context.variables);

		this.logger.log(`URL resolvida: ${resolvedUrl}`);

		// 2. Executar com retry se configurado
		while (attempts < maxAttempts) {
			attempts++;

			try {
				const response = await this.executeRequest({
					url: resolvedUrl,
					method: config.request.method,
					headers: resolvedHeaders,
					body: resolvedBody,
					timeout: config.timeout || 30000,
				});

				const duration = Date.now() - startTime;

				// 3. Montar resultado de sucesso
				const result: ApiStepResult = {
					status: response.status,
					statusText: response.statusText,
					raw: response.data,
					metadata: {
						url: resolvedUrl,
						method: config.request.method,
						timestamp: new Date().toISOString(),
						duration,
						attempts,
					},
				};

				// 4. Aplicar mapping se existir
				if (config.response.mapping) {
				this.logger.log(`[ApiStepExecutor] Response data: ${JSON.stringify(response.data)}`);
				this.logger.log(`[ApiStepExecutor] Mapping config: ${JSON.stringify(config.response.mapping)}`);
					result.parsed = this.applyMapping(response.data, config.response.mapping);
				this.logger.log(`[ApiStepExecutor] Parsed result: ${JSON.stringify(result.parsed)}`);
				}

				this.logger.log(
					`Etapa API concluída com sucesso [${context.etapa_id}] - Status: ${response.status} - Duração: ${duration}ms - Tentativas: ${attempts}`,
				);

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;

				// Se ainda há tentativas, aguardar com backoff exponencial
				if (attempts < maxAttempts) {
					const backoffTime = 1000 * attempts; // 1s, 2s, 3s...
					this.logger.warn(
						`Tentativa ${attempts}/${maxAttempts} falhou para etapa [${context.etapa_id}]. Aguardando ${backoffTime}ms antes de retentar...`,
					);
					await this.sleep(backoffTime);
					continue;
				}

				// Última tentativa falhou, retornar erro
				this.logger.error(
					`Todas as tentativas (${attempts}) falharam para etapa API [${context.etapa_id}]`,
					error,
				);

				return this.buildErrorResult(error, resolvedUrl, config.request.method, duration, attempts);
			}
		}

		// Fallback (não deveria chegar aqui)
		throw new Error('Erro inesperado ao executar etapa API');
	}

	/**
	 * Executa a requisição HTTP
	 */
	private async executeRequest(params: {
		url: string;
		method: string;
		headers?: Record<string, string>;
		body?: any;
		timeout: number;
	}): Promise<AxiosResponse> {
		const { url, method, headers, body, timeout } = params;

		const config: AxiosRequestConfig = {
			url,
			method: method as any,
			headers: headers || {},
			timeout,
		};

		// Adicionar body apenas se método não for GET ou DELETE
		if (body && method !== 'GET' && method !== 'DELETE') {
			config.data = body;

			// Garantir Content-Type se não definido
			if (!config.headers) {
				config.headers = {};
			}
			if (!config.headers['Content-Type'] && !config.headers['content-type']) {
				config.headers['Content-Type'] = 'application/json';
			}
		}

		return await axios(config);
	}

	/**
	 * Aplica o mapeamento de campos da resposta usando JSONPath
	 */
	private applyMapping(data: any, mapping: Record<string, string>): Record<string, any> {
		const result: Record<string, any> = {};

		for (const [outputField, jsonPath] of Object.entries(mapping)) {
			try {
				// Usar biblioteca JSONPath para extração
				const values = JSONPath({ path: jsonPath, json: data });

				// Se encontrou valores, usar o primeiro (ou array se path tiver *)
				if (values && values.length > 0) {
					result[outputField] = values.length === 1 ? values[0] : values;
				} else {
					result[outputField] = null;
				}
			} catch (error) {
				this.logger.warn(`Erro ao aplicar JSONPath "${jsonPath}" para campo "${outputField}": ${error.message}`);
				result[outputField] = null;
			}
		}

		return result;
	}

	/**
	 * Resolve variáveis no formato {{variavel}} em uma string
	 */
	private resolveVariables(text: string | undefined, variables: Record<string, any>): string {
		if (!text) return '';

		return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
			const value = variables[varName];
			return value !== undefined ? String(value) : match;
		});
	}

	/**
	 * Resolve variáveis recursivamente em objetos e arrays
	 */
	private resolveObjectVariables(obj: any, variables: Record<string, any>): any {
		if (obj === null || obj === undefined) {
			return obj;
		}

		if (typeof obj === 'string') {
			return this.resolveVariables(obj, variables);
		}

		if (Array.isArray(obj)) {
			return obj.map((item) => this.resolveObjectVariables(item, variables));
		}

		if (typeof obj === 'object') {
			const resolved: any = {};
			for (const [key, value] of Object.entries(obj)) {
				resolved[key] = this.resolveObjectVariables(value, variables);
			}
			return resolved;
		}

		return obj;
	}

	/**
	 * Constrói resultado de erro
	 */
	private buildErrorResult(
		error: any,
		url: string,
		method: string,
		duration: number,
		attempts: number,
	): ApiStepResult {
		let status = 0;
		let statusText = 'Network Error';
		let errorMessage = 'Erro desconhecido';
		let errorCode = 'UNKNOWN_ERROR';
		let raw: any = null;

		if (axios.isAxiosError(error)) {
			if (error.response) {
				// Resposta HTTP com erro (4xx, 5xx)
				status = error.response.status;
				statusText = error.response.statusText;
				raw = error.response.data;
				errorMessage = `HTTP ${status}: ${statusText}`;
				errorCode = status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
			} else if (error.code === 'ECONNABORTED') {
				// Timeout
				status = 408;
				statusText = 'Request Timeout';
				errorMessage = `Request timeout after ${duration}ms`;
				errorCode = 'TIMEOUT';
			} else if (error.code) {
				// Erros de rede (ECONNREFUSED, ENOTFOUND, etc)
				errorMessage = `Network error: ${error.message}`;
				errorCode = 'NETWORK_ERROR';
			}
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		return {
			status,
			statusText,
			raw,
			error: {
				message: errorMessage,
				code: errorCode,
			},
			metadata: {
				url,
				method,
				timestamp: new Date().toISOString(),
				duration,
				attempts,
			},
		};
	}

	/**
	 * Aguarda por um período de tempo
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
