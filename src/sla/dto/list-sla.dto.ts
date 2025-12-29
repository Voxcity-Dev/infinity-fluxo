import { createZodDto } from 'nestjs-zod';
import { ListSlaSchema, SlaResponseSchema } from 'src/schemas/sla.schema';
import { z } from 'zod';

export const ListSlaResponseSchema = z.object({
	data: z.array(SlaResponseSchema),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export class ListSlaDto extends createZodDto(ListSlaSchema) {}
export class ListSlaResponseDto extends createZodDto(ListSlaResponseSchema) {}

export type ListSlaInput = z.infer<typeof ListSlaSchema>;
export type ListSlaResponse = z.infer<typeof ListSlaResponseSchema>;

