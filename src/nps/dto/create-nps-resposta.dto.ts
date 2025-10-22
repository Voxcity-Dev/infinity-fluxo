import { z } from 'zod';

export const CreateNpsRespostaSchema = z.object({
  nps_id: z.string().uuid(),
  resposta: z.number().int().min(1).max(10),
});

export type CreateNpsRespostaDto = z.infer<typeof CreateNpsRespostaSchema>;
