import { createZodDto } from 'nestjs-zod';
import { ListNpsSchema, NpsResponseSchema } from 'src/schemas/nps.schema';
import { z } from 'zod';

export const ListNpsResponseSchema = z.object({
	data: z.array(NpsResponseSchema),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export class ListNpsDto extends createZodDto(ListNpsSchema) {}
export class ListNpsResponseDto extends createZodDto(ListNpsResponseSchema) {}

export type ListNpsInput = z.infer<typeof ListNpsSchema>;
export type ListNpsResponse = z.infer<typeof ListNpsResponseSchema>;
