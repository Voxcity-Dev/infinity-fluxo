import { createZodDto } from 'nestjs-zod';
import { CreateFluxoSchema } from 'src/schemas/fluxo.schema';
import { z } from 'zod';

export const CreateFluxoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string(),
	created_at: z.date(),
	updated_at: z.date(),
});

export class CreateFluxoDto extends createZodDto(CreateFluxoSchema) {}
export class CreateFluxoResponseDto extends createZodDto(CreateFluxoResponseSchema) {}

export type CreateFluxoInput = z.infer<typeof CreateFluxoSchema>;
export type CreateFluxoResponse = z.infer<typeof CreateFluxoResponseSchema>;
