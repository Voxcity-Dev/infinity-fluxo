import { createZodDto } from 'nestjs-zod';
import { UpdateFlowConfiguracaoSchema } from 'src/schemas/fluxo.schema';
import { z } from 'zod';

export const UpdateFluxoConfiguracaoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	chave: z.string(),
	valor: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const FluxoConfiguracaoParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateFluxoConfiguracaoDto extends createZodDto(UpdateFlowConfiguracaoSchema) {}
export class UpdateFluxoConfiguracaoResponseDto extends createZodDto(
	UpdateFluxoConfiguracaoResponseSchema,
) {}
export class FluxoConfiguracaoParamsDto extends createZodDto(FluxoConfiguracaoParamsSchema) {}

export type UpdateFluxoConfiguracaoInput = z.infer<typeof UpdateFlowConfiguracaoSchema>;
export type UpdateFluxoConfiguracaoResponse = z.infer<typeof UpdateFluxoConfiguracaoResponseSchema>;
export type FluxoConfiguracaoParams = z.infer<typeof FluxoConfiguracaoParamsSchema>;
