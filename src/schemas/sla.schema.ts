import { z } from 'zod';

// Enum para tipos de SLA
export const SlaTipoEnum = z.enum([
	'TEMPO_PRIMEIRA_RESPOSTA',
	'TEMPO_ATENDIMENTO',
	'TEMPO_RESPOSTA',
]);

// Schema para criação de SLA
export const CreateSlaSchema = z.object({
	tenant_id: z.uuid(),
	tipo: SlaTipoEnum,
	tempo: z.number().int().min(0).default(0), // em minutos
});

// Schema para atualização de SLA
export const UpdateSlaSchema = z.object({
	id: z.uuid(),
	tempo: z.number().int().min(0).optional(),
});

// Schema para listagem de SLA
export const ListSlaSchema = z.object({
	tenant_id: z.uuid(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
});

// Schema completo do SLA
export const SlaSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	tipo: SlaTipoEnum,
	tempo: z.number().int(),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

// Schema para resposta da API
export const SlaResponseSchema = SlaSchema;

// Tipos TypeScript
export type CreateSla = z.infer<typeof CreateSlaSchema>;
export type UpdateSla = z.infer<typeof UpdateSlaSchema>;
export type ListSla = z.infer<typeof ListSlaSchema>;
export type Sla = z.infer<typeof SlaSchema>;
export type SlaResponse = z.infer<typeof SlaResponseSchema>;
export type SlaTipo = z.infer<typeof SlaTipoEnum>;

