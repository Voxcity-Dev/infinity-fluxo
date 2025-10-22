import { createZodDto } from 'nestjs-zod';
import { UpdateNpsSchema, NpsResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export class UpdateNpsDto extends createZodDto(UpdateNpsSchema) {}
export class UpdateNpsResponseDto extends createZodDto(NpsResponseSchema) {}

export type UpdateNpsInput = z.infer<typeof UpdateNpsSchema>;
export type UpdateNpsResponse = z.infer<typeof NpsResponseSchema>;
