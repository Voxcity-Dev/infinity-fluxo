import { createZodDto } from 'nestjs-zod';
import { CreateNpsSchema, NpsResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class CreateNpsDto extends createZodDto(CreateNpsSchema) {}
export class CreateNpsResponseDto extends createZodDto(NpsResponseSchema) {}

export type CreateNpsInput = z.infer<typeof CreateNpsSchema>;
export type CreateNpsResponse = z.infer<typeof NpsResponseSchema>;
