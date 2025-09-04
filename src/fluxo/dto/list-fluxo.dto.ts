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

export const FluxoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const FluxoEngineResponseSchema = z.object({
	body: z.string(),
});

export const FluxoEngineInputSchema = z.object({
	ticket_id: z.string(),
	message: z.string(),
});

export class ListFluxosDto extends createZodDto(ListFluxosSchema) {}
export class ListFluxosResponseDto extends createZodDto(ListFluxosResponseSchema) {}
export class FluxoResponseDto extends createZodDto(FluxoResponseSchema) {}
export class FluxoEngineResponseDto extends createZodDto(FluxoEngineResponseSchema) {}

export type ListFluxosInput = z.infer<typeof ListFluxosSchema>;
export type ListFluxosResponse = z.infer<typeof ListFluxosResponseSchema>;
export type FluxoEngineInput = z.infer<typeof FluxoEngineInputSchema>;
