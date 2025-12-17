import { createZodDto } from 'nestjs-zod';
import { ListNpsFilaSchema, NpsFilaResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export const ListNpsFilaResponseSchema = z.object({
	data: z.array(NpsFilaResponseSchema),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export class ListNpsFilaDto extends createZodDto(ListNpsFilaSchema) {}
export class ListNpsFilaResponseDto extends createZodDto(ListNpsFilaResponseSchema) {}

export type ListNpsFilaInput = z.infer<typeof ListNpsFilaSchema>;
export type ListNpsFilaResponse = z.infer<typeof ListNpsFilaResponseSchema>;
