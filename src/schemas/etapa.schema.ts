import { z } from 'zod';

// Enum para o tipo de nó/etapa
export const NodeTypeSchema = z.enum(['INICIO', 'DIALOGO', 'FIM']);

// Schema para criação de etapa
export const CreateEtapaSchema = z.object({
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	nome: z.string().min(1).max(50),
	tipo: NodeTypeSchema,
	interacoes_id: z.uuid().optional(),
	metadados: z.object().optional(),
});

// Schema para atualização de etapa
export const UpdateEtapaSchema = z.object({
	id: z.uuid(),
	nome: z.string().min(1).max(50).optional(),
	tipo: NodeTypeSchema.optional(),
	interacoes_id: z.uuid().optional(),
	metadados: z.object().optional(),
});

// Schema completo da etapa
export const EtapaSchema = z.object({
	id: z.uuid(),
	tenant_id: z.uuid(),
	fluxo_id: z.uuid(),
	nome: z.string().max(50),
	tipo: NodeTypeSchema,
	interacoes_id: z.uuid().optional(),
	is_deleted: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	metadados: z.object(),
});

// Schema para resposta da API (sem campos sensíveis)
export const EtapaResponseSchema = EtapaSchema;

// Tipos TypeScript
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type CreateEtapa = z.infer<typeof CreateEtapaSchema>;
export type UpdateEtapa = z.infer<typeof UpdateEtapaSchema>;
export type Etapa = z.infer<typeof EtapaSchema>;
export type EtapaResponse = z.infer<typeof EtapaResponseSchema>;
