import { createZodDto } from 'nestjs-zod';
import { DeleteNpsFilaSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class DeleteNpsFilaDto extends createZodDto(DeleteNpsFilaSchema) {}

export type DeleteNpsFilaInput = z.infer<typeof DeleteNpsFilaSchema>;
