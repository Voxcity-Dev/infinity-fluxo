import { createZodDto } from 'nestjs-zod';
import { CreateInteracaoSchema } from 'src/schemas/interacao.schema';
import { z } from 'zod';

export const CreateInteracaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	tipo: z.string(),
	conteudo: z.string(),
	url_midia: z.string().nullable(),
	metadados: z.record(z.string(), z.any()).nullable(),
	created_at: z.date(),
	updated_at: z.date(),
});

export class CreateInteracaoDto extends createZodDto(CreateInteracaoSchema) {}
export class CreateInteracaoResponseDto extends createZodDto(CreateInteracaoResponseSchema) {}

export type CreateInteracaoInput = z.infer<typeof CreateInteracaoSchema>;
export type CreateInteracaoResponse = z.infer<typeof CreateInteracaoResponseSchema>;
