import { createZodDto } from 'nestjs-zod';
import { UpdateEtapaSchema } from 'src/schemas/etapa.schema';
import { z } from 'zod';

export const UpdateEtapaResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	nome: z.string(),
	tipo: z.string(),
	interacoes_id: z.array(z.string()),
	created_at: z.string(),
	updated_at: z.string(),
});

export const EtapaParamsSchema = z.object({
	id: z.uuid(),
});

export class UpdateEtapaDto extends createZodDto(UpdateEtapaSchema) {}
export class UpdateEtapaResponseDto extends createZodDto(UpdateEtapaResponseSchema) {}
export class EtapaParamsDto extends createZodDto(EtapaParamsSchema) {}

export type UpdateEtapaInput = z.infer<typeof UpdateEtapaSchema>;
export type UpdateEtapaResponse = z.infer<typeof UpdateEtapaResponseSchema>;
export type EtapaParams = z.infer<typeof EtapaParamsSchema>;
