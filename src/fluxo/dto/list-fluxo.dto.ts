import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListFluxosSchema = z.object({
	tenant_id: z.uuid(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
});

export const ListFluxosResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			nome: z.string(),
			created_at: z.date(),
			updated_at: z.date(),
		}),
	),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export class ListFluxosDto extends createZodDto(ListFluxosSchema) {}
export class ListFluxosResponseDto extends createZodDto(ListFluxosResponseSchema) {}

export type ListFluxosInput = z.infer<typeof ListFluxosSchema>;
export type ListFluxosResponse = z.infer<typeof ListFluxosResponseSchema>;
