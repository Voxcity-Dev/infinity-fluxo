import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListTransacoesSchema = z.object({
	tenant_id: z.uuid(),
	etapa_id: z.uuid().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
});

export const ListTransacoesResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			etapa_id: z.uuid(),
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

export class ListTransacoesDto extends createZodDto(ListTransacoesSchema) {}
export class ListTransacoesResponseDto extends createZodDto(ListTransacoesResponseSchema) {}

export type ListTransacoesInput = z.infer<typeof ListTransacoesSchema>;
export type ListTransacoesResponse = z.infer<typeof ListTransacoesResponseSchema>;
