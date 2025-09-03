import { createZodDto } from 'nestjs-zod';
import { UpdateInteracaoSchema } from 'src/schemas/interacao.schema';
import { z } from 'zod';

export const UpdateInteracaoResponseSchema = z.object({
	id: z.uuid(),
	tipo: z.string().optional(),
	conteudo: z.string().optional(),
	url_midia: z.string().nullable().optional(),
	metadados: z.record(z.string(), z.any()).nullable().optional(),
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
