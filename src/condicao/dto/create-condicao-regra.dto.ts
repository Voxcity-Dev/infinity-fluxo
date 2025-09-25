import { createZodDto } from 'nestjs-zod';
import { CreateCondicaoRegraSchema } from 'src/schemas/condicao.schema';
import { z } from 'zod';

export const CreateCondicaoRegraResponseSchema = z.object({
	id: z.uuid(),
	condicao_id: z.uuid(),
	tenant_id: z.uuid(),
	input: z.string().nullable(),
	action: z.string(),
	msg_exata: z.boolean(),
	next_etapa_id: z.string().nullable(),
	next_fluxo_id: z.string().nullable(),
	queue_id: z.string().nullable(),
	user_id: z.string().nullable(),
	variable_name: z.string().nullable(),
	variable_value: z.string().nullable(),
	api_endpoint: z.string().nullable(),
	db_query: z.string().nullable(),
	priority: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class CreateCondicaoRegraDto extends createZodDto(CreateCondicaoRegraSchema) {}
export class CreateCondicaoRegraResponseDto extends createZodDto(
	CreateCondicaoRegraResponseSchema,
) {}

export type CreateCondicaoRegraInput = z.infer<typeof CreateCondicaoRegraSchema>;
export type CreateCondicaoRegraResponse = z.infer<typeof CreateCondicaoRegraResponseSchema>;
