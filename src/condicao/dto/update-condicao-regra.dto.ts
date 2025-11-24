import { createZodDto } from 'nestjs-zod';
import { UpdateCondicaoRegraSchema } from 'src/schemas/condicao.schema';
import { z } from 'zod';

export const UpdateCondicaoRegraResponseSchema = z.object({
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
	variavel_id: z.string().nullable(),
	api_endpoint: z.string().nullable(),
	db_query: z.string().nullable(),
	priority: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const CondicaoRegraParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateCondicaoRegraDto extends createZodDto(UpdateCondicaoRegraSchema) {}
export class UpdateCondicaoRegraResponseDto extends createZodDto(
	UpdateCondicaoRegraResponseSchema,
) {}
export class CondicaoRegraParamsDto extends createZodDto(CondicaoRegraParamsSchema) {}

export type UpdateCondicaoRegraInput = z.infer<typeof UpdateCondicaoRegraSchema>;
export type UpdateCondicaoRegraResponse = z.infer<typeof UpdateCondicaoRegraResponseSchema>;
export type CondicaoRegraParams = z.infer<typeof CondicaoRegraParamsSchema>;
