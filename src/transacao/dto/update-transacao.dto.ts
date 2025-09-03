import { createZodDto } from 'nestjs-zod';
import { UpdateTransacaoSchema } from 'src/schemas/transacao.schema';
import { z } from 'zod';

export const UpdateTransacaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const TransacaoParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateTransacaoDto extends createZodDto(UpdateTransacaoSchema) {}
export class UpdateTransacaoResponseDto extends createZodDto(UpdateTransacaoResponseSchema) {}
export class TransacaoParamsDto extends createZodDto(TransacaoParamsSchema) {}

export type UpdateTransacaoInput = z.infer<typeof UpdateTransacaoSchema>;
export type UpdateTransacaoResponse = z.infer<typeof UpdateTransacaoResponseSchema>;
export type TransacaoParams = z.infer<typeof TransacaoParamsSchema>;
