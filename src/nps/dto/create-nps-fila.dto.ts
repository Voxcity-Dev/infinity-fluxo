import { createZodDto } from 'nestjs-zod';
import { CreateNpsFilaSchema, NpsFilaResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class CreateNpsFilaDto extends createZodDto(CreateNpsFilaSchema) {}
export class CreateNpsFilaResponseDto extends createZodDto(NpsFilaResponseSchema) {}

export type CreateNpsFilaInput = z.infer<typeof CreateNpsFilaSchema>;
export type CreateNpsFilaResponse = z.infer<typeof NpsFilaResponseSchema>;
