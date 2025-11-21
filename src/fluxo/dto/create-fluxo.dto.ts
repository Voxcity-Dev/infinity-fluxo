import { createZodDto } from 'nestjs-zod';
import { CreateFluxoSchema } from 'src/schemas/fluxo.schema';
import { z } from 'zod';

export const CreateFluxoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string(),
	descricao: z.string().optional(),
	mensagem_finalizacao: z.string().optional(),
	mensagem_invalida: z.string().optional(),
	created_at: z.string(),
	updated_at: z.string(),
});

export class CreateFluxoDto extends createZodDto(CreateFluxoSchema) {}
export class CreateFluxoResponseDto extends createZodDto(CreateFluxoResponseSchema) {}

export type CreateFluxoInput = z.infer<typeof CreateFluxoSchema> & { tenant_id: string };
export type CreateFluxoResponse = z.infer<typeof CreateFluxoResponseSchema>;
