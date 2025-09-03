import { createZodDto } from 'nestjs-zod';
import { CreateEtapaSchema } from 'src/schemas/etapa.schema';
import { z } from 'zod';

export const CreateEtapaResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	nome: z.string(),
	tipo: z.string(),
	interacoes_id: z.array(z.string()),
	created_at: z.string(),
	updated_at: z.string(),
});

export class CreateEtapaDto extends createZodDto(CreateEtapaSchema) {}
export class CreateEtapaResponseDto extends createZodDto(CreateEtapaResponseSchema) {}

export type CreateEtapaInput = z.infer<typeof CreateEtapaSchema>;
export type CreateEtapaResponse = z.infer<typeof CreateEtapaResponseSchema>;
