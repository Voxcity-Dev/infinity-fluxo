import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { InteracaoTipoSchema } from 'src/schemas/interacao.schema';

export const ListInteracoesSchema = z.object({
	tenant_id: z.uuid(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
	tipo: InteracaoTipoSchema.optional(),
});

export const ListInteracoesResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			tipo: InteracaoTipoSchema,
			conteudo: z.string(),
			url_midia: z.string().nullable(),
			metadados: z.record(z.string(), z.any()).nullable(),
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

export class ListInteracoesDto extends createZodDto(ListInteracoesSchema) {}
export class ListInteracoesResponseDto extends createZodDto(ListInteracoesResponseSchema) {}

export type ListInteracoesInput = z.infer<typeof ListInteracoesSchema>;
export type ListInteracoesResponse = z.infer<typeof ListInteracoesResponseSchema>;
