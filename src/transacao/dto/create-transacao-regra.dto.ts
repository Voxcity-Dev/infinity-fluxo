import { createZodDto } from 'nestjs-zod';
import { CreateTransacaoRegraSchema } from 'src/schemas/transacao.schema';
import { z } from 'zod';

export const CreateTransacaoRegraResponseSchema = z.object({
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

export class CreateTransacaoRegraDto extends createZodDto(CreateTransacaoRegraSchema) {}
export class CreateTransacaoRegraResponseDto extends createZodDto(
	CreateTransacaoRegraResponseSchema,
) {}

export type CreateTransacaoRegraInput = z.infer<typeof CreateTransacaoRegraSchema>;
export type CreateTransacaoRegraResponse = z.infer<typeof CreateTransacaoRegraResponseSchema>;
