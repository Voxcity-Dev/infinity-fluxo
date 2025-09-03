import { createZodDto } from 'nestjs-zod';
import { UpdateInteracaoSchema } from 'src/schemas/interacao.schema';
import { z } from 'zod';

export const UpdateInteracaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	tipo: z.string(),
	conteudo: z.string(),
	url_midia: z.string().nullable(),
	metadados: z.record(z.string(), z.any()).nullable(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const InteracaoParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateInteracaoDto extends createZodDto(UpdateInteracaoSchema) {}
export class UpdateInteracaoResponseDto extends createZodDto(UpdateInteracaoResponseSchema) {}
export class InteracaoParamsDto extends createZodDto(InteracaoParamsSchema) {}

export type UpdateInteracaoInput = z.infer<typeof UpdateInteracaoSchema>;
export type UpdateInteracaoResponse = z.infer<typeof UpdateInteracaoResponseSchema>;
export type InteracaoParams = z.infer<typeof InteracaoParamsSchema>;
