import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NodeTypeSchema } from 'src/schemas/etapa.schema';

export const ListEtapasSchema = z.object({
	tenant_id: z.uuid(),
	fluxo_id: z.uuid().optional(),
	interacoes_id: z.uuid().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
	tipo: NodeTypeSchema.optional(),
});

export const ListEtapasResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			fluxo_id: z.uuid(),
			nome: z.string(),
			tipo: NodeTypeSchema,
			interacoes_id: z.uuid(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export const EtapaResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	nome: z.string(),
	tipo: NodeTypeSchema,
	interacoes_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class ListEtapasDto extends createZodDto(ListEtapasSchema) {}
export class ListEtapasResponseDto extends createZodDto(ListEtapasResponseSchema) {}
export class EtapaResponseDto extends createZodDto(EtapaResponseSchema) {}

export type ListEtapasInput = z.infer<typeof ListEtapasSchema>;
export type ListEtapasResponse = z.infer<typeof ListEtapasResponseSchema>;
