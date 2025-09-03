import { z } from 'zod';

// Enum para o tipo de interação
export const InteracaoTipoSchema = z.enum([
	'MESSAGE',
	'IMAGE',
	'AUDIO',
	'VIDEO',
	'FILE',
	'BUTTON',
	'SET_VARIABLE',
	'GET_VARIABLE',
	'API_CALL',
	'DB_QUERY',
]);

// Schema para criação de interação
export const CreateInteracaoSchema = z.object({
	tenant_id: z.uuid(),
	tipo: InteracaoTipoSchema,
	conteudo: z.string(),
	url_midia: z.string().max(500).optional(),
	metadados: z.record(z.string(), z.any()).optional(), // JsonB
});

// Schema para atualização de interação
export const UpdateInteracaoSchema = z.object({
	tipo: InteracaoTipoSchema.optional(),
	conteudo: z.string().optional(),
	url_midia: z.string().max(500).optional(),
	metadados: z.record(z.string(), z.any()).optional(),
});

// Schema completo da interação
export const InteracaoSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	tipo: InteracaoTipoSchema,
	conteudo: z.string(),
	url_midia: z.string().max(500).nullable(),
	metadados: z.record(z.string(), z.any()).nullable(), // JsonB
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API
export const InteracaoResponseSchema = InteracaoSchema;

// Tipos TypeScript
export type InteracaoTipo = z.infer<typeof InteracaoTipoSchema>;
export type CreateInteracao = z.infer<typeof CreateInteracaoSchema>;
export type UpdateInteracao = z.infer<typeof UpdateInteracaoSchema>;
export type Interacao = z.infer<typeof InteracaoSchema>;
export type InteracaoResponse = z.infer<typeof InteracaoResponseSchema>;
