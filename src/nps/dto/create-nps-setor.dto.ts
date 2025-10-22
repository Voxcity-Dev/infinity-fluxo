import { createZodDto } from 'nestjs-zod';
import { CreateNpsSetorSchema, NpsSetorResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class CreateNpsSetorDto extends createZodDto(CreateNpsSetorSchema) {}
export class CreateNpsSetorResponseDto extends createZodDto(NpsSetorResponseSchema) {}

export type CreateNpsSetorInput = z.infer<typeof CreateNpsSetorSchema>;
export type CreateNpsSetorResponse = z.infer<typeof NpsSetorResponseSchema>;
