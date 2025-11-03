import { z } from 'zod';

// Enum para o tipo de ação
export const TipoAcaoSchema = z.enum([
	'ETAPA',
	'FLUXO',
	'FILA',
	'USUARIO',
	'SETAR_VARIAVEL',
	'OBTER_VARIAVEL',
	'API',
	'DB',
]);


// Schema para atualização de transação
export const UpdateCondicaoSchema = z.object({
	etapa_id: z.uuid().optional(),
});

// Schema completo da transação
export const CondicaoSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API
export const CondicaoResponseSchema = CondicaoSchema;

// Schema para criação de regra de transação (input do usuário - sem condicao_id e tenant_id)
export const CreateCondicaoRegraInputSchema = z.object({
	input: z.string().max(50).optional(),
	action: TipoAcaoSchema,
	msg_exata: z.boolean(),
	next_etapa_id: z.uuid().optional(),
	next_fluxo_id: z.uuid().optional(),
	queue_id: z.uuid().optional(),
	user_id: z.uuid().optional(),
	variable_name: z.string().max(50).optional(),
	variable_value: z.string().max(50).optional(),
	api_endpoint: z.string().max(50).optional(),
	db_query: z.string().max(50).optional(),
	priority: z.number().int().default(0),
}).refine((data) => {
	// Se msg_exata for true, input é obrigatório
	if (data.msg_exata && !data.input) {
		return false;
	}
	// Se msg_exata for false, input não é necessário
	return true;
}, {
	message: "Quando msg_exata for true, o campo input é obrigatório",
	path: ["input"]
});

// Schema para criação de regra de transação (completo - para uso interno)
export const CreateCondicaoRegraSchema = CreateCondicaoRegraInputSchema.extend({
	condicao_id: z.uuid(),
	tenant_id: z.uuid(),
});

// Schema para criação de condição
export const CreateCondicaoSchema = z.object({
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	regras: z.array(CreateCondicaoRegraInputSchema),
});


// Schema completo da regra de transação
export const CondicaoRegraSchema = z.object({
	id: z.uuid(),
	condicao_id: z.uuid(),
	tenant_id: z.uuid(),
	input: z.string().max(50).nullable(),
	action: TipoAcaoSchema,
	msg_exata: z.boolean(),
	next_etapa_id: z.uuid().nullable(),
	next_fluxo_id: z.uuid().nullable(),
	queue_id: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
	variable_name: z.string().max(50).nullable(),
	variable_value: z.string().max(50).nullable(),
	api_endpoint: z.string().max(50).nullable(),
	db_query: z.string().max(50).nullable(),
	priority: z.number().int(),
	is_deleted: z.boolean(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
}).refine((data) => {
	// Se msg_exata for true, input é obrigatório (não pode ser null)
	if (data.msg_exata && !data.input) {
		return false;
	}
	// Se msg_exata for false, input pode ser null
	return true;
}, {
	message: "Quando msg_exata for true, o campo input é obrigatório",
	path: ["input"]
});

// Schema para atualização de regra de transação
export const UpdateCondicaoRegraSchema = z.object({
	condicao_id: z.uuid(),
	regras: z.array(z.object({
		id: z.uuid().optional(),
		input: z.string().nullable().optional(),
		action: TipoAcaoSchema,
		msg_exata: z.boolean(),
		next_etapa_id: z.string().nullable().optional(),
		next_fluxo_id: z.string().nullable().optional(),
		queue_id: z.string().nullable().optional(),
		user_id: z.string().nullable().optional(),
		variable_name: z.string().nullable().optional(),
		variable_value: z.string().nullable().optional(),
		api_endpoint: z.string().nullable().optional(),
		db_query: z.string().nullable().optional(),
		priority: z.number().int(),
		is_deleted: z.boolean().optional(),
	}).passthrough()), // Permite campos adicionais
});
// Schema para resposta da API
export const CondicaoRegraResponseSchema = CondicaoRegraSchema;

// Tipos TypeScript
export type TipoAcao = z.infer<typeof TipoAcaoSchema>;
export type CreateCondicao = z.infer<typeof CreateCondicaoSchema>;
export type UpdateCondicao = z.infer<typeof UpdateCondicaoSchema>;
export type Condicao = z.infer<typeof CondicaoSchema>;
export type CondicaoResponse = z.infer<typeof CondicaoResponseSchema>;
export type CreateCondicaoRegraInput = z.infer<typeof CreateCondicaoRegraInputSchema>;
export type CreateCondicaoRegra = z.infer<typeof CreateCondicaoRegraSchema>;
export type UpdateCondicaoRegra = z.infer<typeof UpdateCondicaoRegraSchema>;
export type CondicaoRegra = z.infer<typeof CondicaoRegraSchema>;
export type CondicaoRegraResponse = z.infer<typeof CondicaoRegraResponseSchema>;
