import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema para resposta simplificada do NPS por fila
export const NpsByFilaSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  pesquisa: z.string(),
});

export class NpsByFilaDto extends createZodDto(NpsByFilaSchema) {}

export type NpsByFila = z.infer<typeof NpsByFilaSchema>;
