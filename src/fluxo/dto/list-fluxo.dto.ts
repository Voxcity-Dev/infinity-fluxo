import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListFluxosSchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
});

export const ListFluxosResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.uuid(),
			tenant_id: z.uuid(),
			nome: z.string(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
	meta: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	}),
});

export const FluxoResponseSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	nome: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const FluxoEngineResponseSchema = z.object({
	etapa_id: z.uuid(),
	fluxo_id: z.uuid(),
	conteudo: z
		.object({
			mensagem: z.string().optional().array(),
			file: z
				.object({
					nome: z.string(),
					url: z.string(),
					tipo: z.enum(['imagem', 'audio', 'video', 'arquivo']),
				})
				.optional(),
		})
		.refine(
			({ file, mensagem }) => {
				return file || mensagem;
			},
			{
				message: 'Deve ter mensagem ou arquivo',
				path: ['conteudo'],
			},
		),
});

export const FluxoEngineInputSchema = z.object({
	ticket_id: z.string(),
	contato_id: z.string().optional(),
	tenant_id: z.string().optional(),
	executar_segunda_regra: z.boolean().optional(),
	...FluxoEngineResponseSchema.shape,
});

export class ListFluxosDto extends createZodDto(ListFluxosSchema) {}
export class ListFluxosResponseDto extends createZodDto(ListFluxosResponseSchema) {}
export class FluxoResponseDto extends createZodDto(FluxoResponseSchema) {}
export class FluxoEngineResponseDto extends createZodDto(FluxoEngineResponseSchema) {}
export class FluxoEngineInputDto extends createZodDto(FluxoEngineInputSchema) {}

export type ListFluxosInput = z.infer<typeof ListFluxosSchema> & { tenant_id: string };
export type ListFluxosResponse = z.infer<typeof ListFluxosResponseSchema>;
export type FluxoEngineInput = z.infer<typeof FluxoEngineInputSchema>;
