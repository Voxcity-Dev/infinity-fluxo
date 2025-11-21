import { z } from 'zod';

// Enum para as chaves de configuração do fluxo
export const FLUXO_CONFIGURACAO_CHAVES = [
	'ENVIA_MENSAGEM',
	'MENSAGEM_INVALIDA',
	'MENSAGEM_FINALIZACAO',
	'TEMPO_MAXIMO',
	'FILA_PADRAO',
	'USUARIO_PADRAO',
	'MAXIMO_TENTATIVAS',
	'DISTRIBUICAO_AUTOMATICA',
	'ENCERRAR_FLUXO_CONDIÇÃO',
] as const;

export const FlowConfiguracaoChaveSchema = z.enum(FLUXO_CONFIGURACAO_CHAVES);

// Schema para criação de fluxo
export const CreateFluxoSchema = z
	.object({
		nome: z.string().min(1).max(50),
		descricao: z.string().optional(),
		mensagem_finalizacao: z.string().optional(),
		mensagem_invalida: z.string().optional(),
	})
	.strip();

// Schema para atualização de fluxo
export const UpdateFluxoSchema = z.object({
	nome: z.string().min(1).max(50).optional(),
	descricao: z.string().optional(),
	mensagem_finalizacao: z.string().optional(),
	mensagem_invalida: z.string().optional(),
});

// Schema completo do fluxo
export const FluxoSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string().max(50),
	descricao: z.string().optional(),
	mensagem_finalizacao: z.string().optional(),
	mensagem_invalida: z.string().optional(),
	etapas: z.array(z.uuid()),
	configuracoes: z.array(z.uuid()),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API
export const FluxoResponseSchema = FluxoSchema;

// Schema para criação de configuração de fluxo
export const CreateFlowConfiguracaoSchema = z.object({
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	chave: FlowConfiguracaoChaveSchema,
	valor: z.string(),
	mensagem_finalizacao: z.string().optional(),
	mensagem_invalida: z.string().optional(),
});

// Schema para atualização de configuração de fluxo
export const UpdateFlowConfiguracaoSchema = z.object({
	configuracoes: z.array(
		z.object({
			id: z.uuid(),
			valor: z.string(),
			mensagem_finalizacao: z.string().optional(),
			mensagem_invalida: z.string().optional(),
		}),
	),
});

// Schema completo da configuração de fluxo
export const FlowConfiguracaoSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	chave: FlowConfiguracaoChaveSchema,
	valor: z.string(),
	mensagem_finalizacao: z.string().optional(),
	mensagem_invalida: z.string().optional(),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API
export const FlowConfiguracaoResponseSchema = FlowConfiguracaoSchema;

// Tipos TypeScript
export type FlowConfiguracaoChave = z.infer<typeof FlowConfiguracaoChaveSchema>;
export type CreateFluxo = z.infer<typeof CreateFluxoSchema>;
export type UpdateFluxo = z.infer<typeof UpdateFluxoSchema>;
export type Fluxo = z.infer<typeof FluxoSchema>;
export type FluxoResponse = z.infer<typeof FluxoResponseSchema>;
export type CreateFlowConfiguracao = z.infer<typeof CreateFlowConfiguracaoSchema>;
export type UpdateFlowConfiguracao = z.infer<typeof UpdateFlowConfiguracaoSchema>;
export type FlowConfiguracao = z.infer<typeof FlowConfiguracaoSchema>;
export type FlowConfiguracaoResponse = z.infer<typeof FlowConfiguracaoResponseSchema>;
