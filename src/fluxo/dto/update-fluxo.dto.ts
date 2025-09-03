import { createZodDto } from 'nestjs-zod';
import { UpdateFluxoSchema } from 'src/schemas/fluxo.schema';
import { z } from 'zod';

export const UpdateFluxoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const FluxoParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateFluxoDto extends createZodDto(UpdateFluxoSchema) {}
export class UpdateFluxoResponseDto extends createZodDto(UpdateFluxoResponseSchema) {}
export class FluxoParamsDto extends createZodDto(FluxoParamsSchema) {}

export type UpdateFluxoInput = z.infer<typeof UpdateFluxoSchema>;
export type UpdateFluxoResponse = z.infer<typeof UpdateFluxoResponseSchema>;
export type FluxoParams = z.infer<typeof FluxoParamsSchema>;
