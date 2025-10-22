import { createZodDto } from 'nestjs-zod';
import { ListNpsSetorSchema, NpsSetorResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export const ListNpsSetorResponseSchema = z.object({
	data: z.array(NpsSetorResponseSchema),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export class ListNpsSetorDto extends createZodDto(ListNpsSetorSchema) {}
export class ListNpsSetorResponseDto extends createZodDto(ListNpsSetorResponseSchema) {}

export type ListNpsSetorInput = z.infer<typeof ListNpsSetorSchema>;
export type ListNpsSetorResponse = z.infer<typeof ListNpsSetorResponseSchema>;
