import { z } from 'zod';

// Enum para o tipo de ação
export const TipoAcaoSchema = z.enum([
	'GO_TO_ETAPA',
	'GO_TO_FLUXO',
	'END_FLUXO',
	'SEND_TO_QUEUE',
	'SEND_TO_USER',
	'SET_VARIABLE',
	'GET_VARIABLE',
	'API_CALL',
	'DB_QUERY',
]);

// Schema para criação de transação
export const CreateTransacaoSchema = z.object({
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
});

// Schema para atualização de transação
export const UpdateTransacaoSchema = z.object({
	etapa_id: z.uuid().optional(),
});

// Schema completo da transação
export const TransacaoSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.date(),
	updated_at: z.date(),
});

// Schema para resposta da API
export const TransacaoResponseSchema = TransacaoSchema;

// Schema para criação de regra de transação
export const CreateTransacaoRegraSchema = z.object({
	transacao_id: z.uuid(),
	tenant_id: z.uuid(),
	input: z.string().max(50),
	action: TipoAcaoSchema,
	next_etapa_id: z.uuid().optional(),
	next_fluxo_id: z.uuid().optional(),
	queue_id: z.uuid().optional(),
	user_id: z.uuid().optional(),
	variable_name: z.string().max(50).optional(),
	variable_value: z.string().max(50).optional(),
	api_endpoint: z.string().max(50).optional(),
	db_query: z.string().max(50).optional(),
	priority: z.number().int().default(0),
});

// Schema para atualização de regra de transação
export const UpdateTransacaoRegraSchema = z.object({
	input: z.string().max(50).optional(),
	action: TipoAcaoSchema.optional(),
	next_etapa_id: z.uuid().optional(),
	next_fluxo_id: z.uuid().optional(),
	queue_id: z.uuid().optional(),
	user_id: z.uuid().optional(),
	variable_name: z.string().max(50).optional(),
	variable_value: z.string().max(50).optional(),
	api_endpoint: z.string().max(50).optional(),
	db_query: z.string().max(50).optional(),
	priority: z.number().int().optional(),
});

// Schema completo da regra de transação
export const TransacaoRegraSchema = z.object({
	id: z.uuid(),
	transacao_id: z.uuid(),
	tenant_id: z.uuid(),
	input: z.string().max(50),
	action: TipoAcaoSchema,
	next_etapa_id: z.uuid().nullable(),
	next_fluxo_id: z.uuid().nullable(),
	queue_id: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
	variable_name: z.string().max(50).nullable(),
	variable_value: z.string().max(50).nullable(),
	api_endpoint: z.string().max(50).nullable(),
	db_query: z.string().max(50).nullable(),
	priority: z.number().int(),
	created_at: z.date(),
	updated_at: z.date(),
});

// Schema para resposta da API
export const TransacaoRegraResponseSchema = TransacaoRegraSchema;

// Tipos TypeScript
export type TipoAcao = z.infer<typeof TipoAcaoSchema>;
export type CreateTransacao = z.infer<typeof CreateTransacaoSchema>;
export type UpdateTransacao = z.infer<typeof UpdateTransacaoSchema>;
export type Transacao = z.infer<typeof TransacaoSchema>;
export type TransacaoResponse = z.infer<typeof TransacaoResponseSchema>;
export type CreateTransacaoRegra = z.infer<typeof CreateTransacaoRegraSchema>;
export type UpdateTransacaoRegra = z.infer<typeof UpdateTransacaoRegraSchema>;
export type TransacaoRegra = z.infer<typeof TransacaoRegraSchema>;
export type TransacaoRegraResponse = z.infer<typeof TransacaoRegraResponseSchema>;
