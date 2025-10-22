import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema para resposta simplificada do NPS por setor
export const NpsBySetorSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  pesquisa: z.string(),
});

export class NpsBySetorDto extends createZodDto(NpsBySetorSchema) {}

export type NpsBySetor = z.infer<typeof NpsBySetorSchema>;
