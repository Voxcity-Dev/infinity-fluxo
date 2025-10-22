import { z } from 'zod';

// Schema para execução de NPS
export const ExecuteNpsSchema = z.object({
	setor_id: z.uuid(),
	ticket_id: z.string().optional(),
	resposta: z.number().int().min(1).max(10),
});

// Schema para responder NPS
export const RespostaNpsSchema = z.object({
	nps_id: z.uuid(),
	ticket_id: z.string(),
	nota: z.number().int().min(1).max(10),
});

// Schema para criação de NPS
export const CreateNpsSchema = z.object({
	tenant_id: z.uuid(),
	nome: z.string().max(50),
	pesquisa: z.string(),
});

// Schema para atualização de NPS
export const UpdateNpsSchema = z.object({
	id: z.uuid(),
	nome: z.string().max(50).optional(),
	pesquisa: z.string().optional(),
});

// Schema para listagem de NPS
export const ListNpsSchema = z.object({
	tenant_id: z.uuid(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
});

// Schema para criação de vínculo NpsSetor
export const CreateNpsSetorSchema = z.object({
	tenant_id: z.uuid(),
	nps_id: z.uuid(),
	setor_id: z.uuid(),
});

// Schema para listagem de setores de um NPS
export const ListNpsSetorSchema = z.object({
	nps_id: z.uuid(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
});

// Schema para remoção de vínculo NpsSetor
export const DeleteNpsSetorSchema = z.object({
	id: z.uuid(),
});

// Schema completo do NPS
export const NpsSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string().max(50),
	pesquisa: z.string(),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema completo do NpsSetor
export const NpsSetorSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nps_id: z.uuid(),
	setor_id: z.uuid(),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API com contagem de setores
export const NpsResponseSchema = NpsSchema.extend({
	setores_count: z.number(),
});
export const NpsSetorResponseSchema = NpsSetorSchema;

// Schema para resposta do NPSResposta
export const NpsRespostaSchema = z.object({
	resposta: z.string('Obrigado por responder a pesquisa!'),
});

export const ResponderNpsResponseSchema = NpsRespostaSchema;

// Tipos TypeScript
export type CreateNps = z.infer<typeof CreateNpsSchema>;
export type UpdateNps = z.infer<typeof UpdateNpsSchema>;
export type ListNps = z.infer<typeof ListNpsSchema>;
export type CreateNpsSetor = z.infer<typeof CreateNpsSetorSchema>;
export type ListNpsSetor = z.infer<typeof ListNpsSetorSchema>;
export type DeleteNpsSetor = z.infer<typeof DeleteNpsSetorSchema>;
export type Nps = z.infer<typeof NpsSchema>;
export type NpsSetor = z.infer<typeof NpsSetorSchema>;
export type NpsResponse = z.infer<typeof NpsResponseSchema>;
export type NpsSetorResponse = z.infer<typeof NpsSetorResponseSchema>;
export type RespostaNps = z.infer<typeof RespostaNpsSchema>;
export type NpsResposta = z.infer<typeof NpsRespostaSchema>;
export type ResponderNpsResponse = z.infer<typeof ResponderNpsResponseSchema>;
