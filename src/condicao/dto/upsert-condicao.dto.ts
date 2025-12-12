import { createZodDto } from 'nestjs-zod';
import { UpsertCondicaoSchema } from 'src/schemas/condicao.schema';
import { z } from 'zod';

export const UpsertCondicaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class UpsertCondicaoDto extends createZodDto(UpsertCondicaoSchema) {}
export class UpsertCondicaoResponseDto extends createZodDto(UpsertCondicaoResponseSchema) {}

export type UpsertCondicaoInput = z.infer<typeof UpsertCondicaoSchema> & { tenant_id: string };
export type UpsertCondicaoResponse = z.infer<typeof UpsertCondicaoResponseSchema>;

