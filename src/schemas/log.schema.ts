import { z } from 'zod';

export const LogSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	ticket_id: z.string(),
	fluxo_id: z.uuid(),
	etapa_id: z.uuid(),
	opcao_id: z.uuid().nullable(),
});

export const CreateLogSchema = LogSchema.omit({ id: true });

export const UpdateLogSchema = LogSchema.partial();

export type CreateLog = z.infer<typeof CreateLogSchema>;
export type UpdateLog = z.infer<typeof UpdateLogSchema>;