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

// Schema base para criação de regra de transação (sem refinement)
const CreateCondicaoRegraBaseSchema = z.object({
	input: z.array(z.string()).min(1, "Pelo menos uma entrada é obrigatória").optional(),
	action: TipoAcaoSchema,
	msg_exata: z.boolean(),
	next_etapa_id: z.uuid().optional(),
	next_fluxo_id: z.uuid().optional(),
	queue_id: z.uuid().optional(),
	user_id: z.uuid().optional(),
	variavel_id: z.uuid().optional(),
	api_endpoint: z.string().max(50).optional(),
	db_query: z.string().max(50).optional(),
	priority: z.number().int().default(0),
});

// Schema para criação de regra de transação (input do usuário - sem condicao_id e tenant_id)
export const CreateCondicaoRegraInputSchema = CreateCondicaoRegraBaseSchema.refine((data) => {
	// Se msg_exata for true, input é obrigatório e não pode estar vazio
	if (data.msg_exata && (!data.input || data.input.length === 0)) {
		return false;
	}
	// Se msg_exata for false, input não é necessário
	return true;
}, {
	message: "Quando msg_exata for true, o campo input é obrigatório e deve ter pelo menos um valor",
	path: ["input"]
});

// Schema para criação de regra de transação (completo - para uso interno)
export const CreateCondicaoRegraSchema = CreateCondicaoRegraBaseSchema.extend({
	condicao_id: z.uuid(),
	tenant_id: z.uuid(),
}).refine((data) => {
	// Se msg_exata for true, input é obrigatório e não pode estar vazio
	if (data.msg_exata && (!data.input || data.input.length === 0)) {
		return false;
	}
	// Se msg_exata for false, input não é necessário
	return true;
}, {
	message: "Quando msg_exata for true, o campo input é obrigatório e deve ter pelo menos um valor",
	path: ["input"]
});

// Schema para criação de condição
export const CreateCondicaoSchema = z
	.object({
		etapa_id: z.uuid({
			message: "etapa_id deve ser um UUID válido. Certifique-se de que a etapa foi salva antes de criar condições.",
		}),
		regras: z.array(CreateCondicaoRegraInputSchema),
	})
	.strip();


// Schema completo da regra de transação
export const CondicaoRegraSchema = z.object({
	id: z.uuid(),
	condicao_id: z.uuid(),
	tenant_id: z.uuid(),
	input: z.array(z.string()).nullable(),
	action: TipoAcaoSchema,
	msg_exata: z.boolean(),
	next_etapa_id: z.uuid().nullable(),
	next_fluxo_id: z.uuid().nullable(),
	queue_id: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
	variavel_id: z.uuid().nullable(),
	api_endpoint: z.string().max(50).nullable(),
	db_query: z.string().max(50).nullable(),
	priority: z.number().int(),
	is_deleted: z.boolean(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
}).refine((data) => {
	// Se msg_exata for true, input é obrigatório e não pode estar vazio
	if (data.msg_exata && (!data.input || data.input.length === 0)) {
		return false;
	}
	// Se msg_exata for false, input pode ser null ou vazio
	return true;
}, {
	message: "Quando msg_exata for true, o campo input é obrigatório e deve ter pelo menos um valor",
	path: ["input"]
});

// Schema para atualização de regra de transação
export const UpdateCondicaoRegraSchema = z.object({
	condicao_id: z.uuid(),
	regras: z.array(z.object({
		id: z.uuid().optional(),
		input: z.array(z.string()).nullable().optional(),
		action: TipoAcaoSchema,
		msg_exata: z.boolean(),
		next_etapa_id: z.string().nullable().optional(),
		next_fluxo_id: z.string().nullable().optional(),
		queue_id: z.string().nullable().optional(),
		user_id: z.string().nullable().optional(),
		variavel_id: z.uuid().nullable().optional(),
		api_endpoint: z.string().nullable().optional(),
		db_query: z.string().nullable().optional(),
		priority: z.number().int(),
		is_deleted: z.boolean().optional(),
	}).passthrough()), // Permite campos adicionais
});

// Schema para upsert de condição (criar ou atualizar)
export const UpsertCondicaoSchema = z
	.object({
		etapa_id: z.uuid({
			message: "etapa_id deve ser um UUID válido. Certifique-se de que a etapa foi salva antes de criar condições.",
		}),
		regras: z.array(z.object({
			id: z.uuid().optional(),
			input: z.array(z.string()).min(1, "Pelo menos uma entrada é obrigatória").nullable().optional(),
			action: TipoAcaoSchema,
			msg_exata: z.boolean(),
			next_etapa_id: z.string().nullable().optional(),
			next_fluxo_id: z.string().nullable().optional(),
			queue_id: z.string().nullable().optional(),
			user_id: z.string().nullable().optional(),
			variavel_id: z.uuid().nullable().optional(),
			api_endpoint: z.string().nullable().optional(),
			db_query: z.string().nullable().optional(),
			priority: z.number().int(),
			is_deleted: z.boolean().optional(),
		}).passthrough().refine((data) => {
			// Se msg_exata for true, input é obrigatório e não pode estar vazio
			if (data.msg_exata && (!data.input || data.input.length === 0)) {
				return false;
			}
			return true;
		}, {
			message: "Quando msg_exata for true, o campo input é obrigatório e deve ter pelo menos um valor",
			path: ["input"]
		})),
	})
	.strip();

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
export type UpsertCondicao = z.infer<typeof UpsertCondicaoSchema>;
export type CondicaoRegra = z.infer<typeof CondicaoRegraSchema>;
export type CondicaoRegraResponse = z.infer<typeof CondicaoRegraResponseSchema>;
