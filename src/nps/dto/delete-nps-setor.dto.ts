import { createZodDto } from 'nestjs-zod';
import { DeleteNpsSetorSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class DeleteNpsSetorDto extends createZodDto(DeleteNpsSetorSchema) {}

export type DeleteNpsSetorInput = z.infer<typeof DeleteNpsSetorSchema>;
