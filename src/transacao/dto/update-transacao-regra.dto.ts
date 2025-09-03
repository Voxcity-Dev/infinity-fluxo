import { createZodDto } from 'nestjs-zod';
import { UpdateTransacaoRegraSchema } from 'src/schemas/transacao.schema';
import { z } from 'zod';

export const UpdateTransacaoRegraResponseSchema = z.object({
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
	created_at: z.string(),
	updated_at: z.string(),
});

export const TransacaoRegraParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateTransacaoRegraDto extends createZodDto(UpdateTransacaoRegraSchema) {}
export class UpdateTransacaoRegraResponseDto extends createZodDto(
	UpdateTransacaoRegraResponseSchema,
) {}
export class TransacaoRegraParamsDto extends createZodDto(TransacaoRegraParamsSchema) {}

export type UpdateTransacaoRegraInput = z.infer<typeof UpdateTransacaoRegraSchema>;
export type UpdateTransacaoRegraResponse = z.infer<typeof UpdateTransacaoRegraResponseSchema>;
export type TransacaoRegraParams = z.infer<typeof TransacaoRegraParamsSchema>;
