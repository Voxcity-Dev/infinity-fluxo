import { createZodDto } from 'nestjs-zod';
import { CreateFlowConfiguracaoSchema } from 'src/schemas/fluxo.schema';
import { z } from 'zod';

export const CreateFluxoConfiguracaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	chave: z.string(),
	valor: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
});

export class CreateFluxoConfiguracaoDto extends createZodDto(CreateFlowConfiguracaoSchema) {}
export class CreateFluxoConfiguracaoResponseDto extends createZodDto(
	CreateFluxoConfiguracaoResponseSchema,
) {}

export type CreateFluxoConfiguracaoInput = z.infer<typeof CreateFlowConfiguracaoSchema>;
export type CreateFluxoConfiguracaoResponse = z.infer<typeof CreateFluxoConfiguracaoResponseSchema>;
