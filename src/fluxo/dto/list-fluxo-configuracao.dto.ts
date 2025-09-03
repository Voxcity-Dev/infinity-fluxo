import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListFluxoConfiguracoesSchema = z.object({
	fluxo_id: z.uuid(),
});

export const ListFluxoConfiguracoesResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			fluxo_id: z.uuid(),
			chave: z.string(),
			valor: z.string(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
});

export class ListFluxoConfiguracoesDto extends createZodDto(ListFluxoConfiguracoesSchema) {}
export class ListFluxoConfiguracoesResponseDto extends createZodDto(
	ListFluxoConfiguracoesResponseSchema,
) {}

export type ListFluxoConfiguracoesInput = z.infer<typeof ListFluxoConfiguracoesSchema>;
export type ListFluxoConfiguracoesResponse = z.infer<typeof ListFluxoConfiguracoesResponseSchema>;
