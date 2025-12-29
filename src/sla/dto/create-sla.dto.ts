import { createZodDto } from 'nestjs-zod';
import { CreateSlaSchema, SlaResponseSchema } from 'src/schemas/sla.schema';
import { z } from 'zod';

export class CreateSlaDto extends createZodDto(CreateSlaSchema) {}
export class CreateSlaResponseDto extends createZodDto(SlaResponseSchema) {}

export type CreateSlaInput = z.infer<typeof CreateSlaSchema>;
export type CreateSlaResponse = z.infer<typeof SlaResponseSchema>;

