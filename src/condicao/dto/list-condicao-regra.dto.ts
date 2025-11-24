import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListCondicaoRegrasSchema = z.object({
	condicao_id: z.uuid(),
});

export const ListCondicaoRegrasResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			condicao_id: z.uuid(),
			tenant_id: z.uuid(),
			input: z.string(),
			action: z.string(),
			msg_exata: z.boolean(),
			next_etapa_id: z.string().nullable(),
			next_fluxo_id: z.string().nullable(),
			queue_id: z.string().nullable(),
			user_id: z.string().nullable(),
			variavel_id: z.string().nullable(),
			api_endpoint: z.string().nullable(),
			db_query: z.string().nullable(),
			priority: z.number(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
});

export class ListCondicaoRegrasDto extends createZodDto(ListCondicaoRegrasSchema) {}
export class ListCondicaoRegrasResponseDto extends createZodDto(
	ListCondicaoRegrasResponseSchema,
) {}

export type ListCondicaoRegrasInput = z.infer<typeof ListCondicaoRegrasSchema>;
export type ListCondicaoRegrasResponse = z.infer<typeof ListCondicaoRegrasResponseSchema>;
