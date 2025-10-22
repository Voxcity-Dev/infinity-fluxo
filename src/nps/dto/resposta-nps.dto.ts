import { createZodDto } from 'nestjs-zod';
import { RespostaNpsSchema, ResponderNpsResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class RespostaNpsDto extends createZodDto(RespostaNpsSchema) {}
export class ResponderNpsResponseDto extends createZodDto(ResponderNpsResponseSchema) {}

export type RespostaNpsInput = z.infer<typeof RespostaNpsSchema>;
export type ResponderNpsResponse = z.infer<typeof ResponderNpsResponseSchema>;
