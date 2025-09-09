import { createZodDto } from 'nestjs-zod';
import { UpdateCondicaoSchema } from 'src/schemas/condicao.schema';
import { z } from 'zod';

export const UpdateCondicaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	etapa_id: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const CondicaoParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateCondicaoDto extends createZodDto(UpdateCondicaoSchema) {}
export class UpdateCondicaoResponseDto extends createZodDto(UpdateCondicaoResponseSchema) {}
export class CondicaoParamsDto extends createZodDto(CondicaoParamsSchema) {}

export type UpdateCondicaoInput = z.infer<typeof UpdateCondicaoSchema>;
export type UpdateCondicaoResponse = z.infer<typeof UpdateCondicaoResponseSchema>;
export type CondicaoParams = z.infer<typeof CondicaoParamsSchema>;
