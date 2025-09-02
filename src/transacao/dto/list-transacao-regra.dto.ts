import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListTransacaoRegrasSchema = z.object({
	transacao_id: z.uuid(),
});

export const ListTransacaoRegrasResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			transacao_id: z.uuid(),
			tenant_id: z.uuid(),
			input: z.string(),
			action: z.string(),
			next_etapa_id: z.string().nullable(),
			next_fluxo_id: z.string().nullable(),
			queue_id: z.string().nullable(),
			user_id: z.string().nullable(),
			variable_name: z.string().nullable(),
			variable_value: z.string().nullable(),
			api_endpoint: z.string().nullable(),
			db_query: z.string().nullable(),
			priority: z.number(),
			created_at: z.date(),
			updated_at: z.date(),
		}),
	),
});

export class ListTransacaoRegrasDto extends createZodDto(ListTransacaoRegrasSchema) {}
export class ListTransacaoRegrasResponseDto extends createZodDto(
	ListTransacaoRegrasResponseSchema,
) {}

export type ListTransacaoRegrasInput = z.infer<typeof ListTransacaoRegrasSchema>;
export type ListTransacaoRegrasResponse = z.infer<typeof ListTransacaoRegrasResponseSchema>;
