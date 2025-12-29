import { createZodDto } from 'nestjs-zod';
import { UpdateSlaSchema, SlaResponseSchema } from 'src/schemas/sla.schema';
import { z } from 'zod';

export class UpdateSlaDto extends createZodDto(UpdateSlaSchema) {}
export class UpdateSlaResponseDto extends createZodDto(SlaResponseSchema) {}

export type UpdateSlaInput = z.infer<typeof UpdateSlaSchema>;
export type UpdateSlaResponse = z.infer<typeof SlaResponseSchema>;

