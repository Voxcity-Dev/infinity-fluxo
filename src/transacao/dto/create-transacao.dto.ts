import { createZodDto } from 'nestjs-zod';
import { CreateTransacaoSchema } from 'src/schemas/transacao.schema';
import { z } from 'zod';

export const CreateTransacaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class CreateTransacaoDto extends createZodDto(CreateTransacaoSchema) {}
export class CreateTransacaoResponseDto extends createZodDto(CreateTransacaoResponseSchema) {}

export type CreateTransacaoInput = z.infer<typeof CreateTransacaoSchema>;
export type CreateTransacaoResponse = z.infer<typeof CreateTransacaoResponseSchema>;
