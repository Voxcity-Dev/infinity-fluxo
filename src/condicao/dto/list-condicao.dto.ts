import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListCondicoesSchema = z
	.object({
		etapa_id: z.uuid().optional(),
		page: z.number().int().min(1).default(1),
		limit: z.number().int().min(1).max(100).default(10),
	})
	.strip();

export const ListCondicoesResponseSchema = z.object({
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

export class ListCondicoesDto extends createZodDto(ListCondicoesSchema) {}
export class ListCondicoesResponseDto extends createZodDto(ListCondicoesResponseSchema) {}

export type ListCondicoesInput = z.infer<typeof ListCondicoesSchema> & { tenant_id: string };
export type ListCondicoesResponse = z.infer<typeof ListCondicoesResponseSchema>;
