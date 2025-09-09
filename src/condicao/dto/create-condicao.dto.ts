import { createZodDto } from 'nestjs-zod';
import { CreateCondicaoSchema } from 'src/schemas/condicao.schema';
import { z } from 'zod';

export const CreateCondicaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class CreateCondicaoDto extends createZodDto(CreateCondicaoSchema) {}
export class CreateCondicaoResponseDto extends createZodDto(CreateCondicaoResponseSchema) {}

export type CreateCondicaoInput = z.infer<typeof CreateCondicaoSchema>;
export type CreateCondicaoResponse = z.infer<typeof CreateCondicaoResponseSchema>;
