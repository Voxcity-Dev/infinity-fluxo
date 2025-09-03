import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema para iniciar execução de fluxo
export const IniciarExecucaoFluxoSchema = z.object({
	usuario_id: z.string().uuid().optional(),
	conversa_id: z.string().uuid().optional(),
	atendimento_id: z.string().uuid().optional(),
	variaveis_iniciais: z.record(z.string(), z.any()).optional(),
});

// Schema para processar resposta
export const ProcessarRespostaSchema = z.object({
	resposta: z.any(),
});

// Schema para definir variável
export const DefinirVariavelSchema = z.object({
	nome: z.string().min(1),
	valor: z.any(),
});

// Schema para finalizar fluxo
export const FinalizarFluxoSchema = z.object({
	motivo: z.string().optional(),
});

// Schema para parâmetros de contexto
export const ContextoParamsSchema = z.object({
	contexto_id: z.string(),
});

// Schema para parâmetros de fluxo
export const FluxoParamsSchema = z.object({
	id: z.uuid(),
});

// Schemas de resposta
export const ExecucaoFluxoResponseSchema = z.object({
	contexto_id: z.string(),
	etapa_id: z.string(),
	sucesso: z.boolean(),
	acao_executada: z.string(),
	dados: z.any().optional(),
	erro: z.string().optional(),
});

export const EstadoFluxoResponseSchema = z.object({
	contexto_id: z.string(),
	fluxo_id: z.string(),
	tenant_id: z.string(),
	usuario_id: z.string().optional(),
	conversa_id: z.string().optional(),
	atendimento_id: z.string().optional(),
	variaveis: z.record(z.string(), z.any()),
	estado_atual: z.enum(['ATIVO', 'PAUSADO', 'FINALIZADO', 'ERRO']),
	etapa_atual_id: z.string().optional(),
	configuracoes: z.record(z.string(), z.string()),
	timeout: z.string().optional(),
	retry_count: z.number(),
	max_retries: z.number(),
});

export const ValidacaoFluxoResponseSchema = z.object({
	valido: z.boolean(),
	erros: z.array(z.string()),
	avisos: z.array(z.string()),
});

export const EstatisticasFluxoResponseSchema = z.object({
	total_execucoes: z.number(),
	ativos: z.number(),
	pausados: z.number(),
	finalizados: z.number(),
	com_erro: z.number(),
	tempo_medio_execucao: z.number(),
});

// DTOs
export class IniciarExecucaoFluxoDto extends createZodDto(IniciarExecucaoFluxoSchema) {}
export class ProcessarRespostaDto extends createZodDto(ProcessarRespostaSchema) {}
export class DefinirVariavelDto extends createZodDto(DefinirVariavelSchema) {}
export class FinalizarFluxoDto extends createZodDto(FinalizarFluxoSchema) {}
export class ContextoParamsDto extends createZodDto(ContextoParamsSchema) {}
export class FluxoParamsDto extends createZodDto(FluxoParamsSchema) {}

// DTOs de resposta
export class ExecucaoFluxoResponseDto extends createZodDto(ExecucaoFluxoResponseSchema) {}
export class EstadoFluxoResponseDto extends createZodDto(EstadoFluxoResponseSchema) {}
export class ValidacaoFluxoResponseDto extends createZodDto(ValidacaoFluxoResponseSchema) {}
export class EstatisticasFluxoResponseDto extends createZodDto(EstatisticasFluxoResponseSchema) {}

// Tipos TypeScript
export type IniciarExecucaoFluxoInput = z.infer<typeof IniciarExecucaoFluxoSchema>;
export type ProcessarRespostaInput = z.infer<typeof ProcessarRespostaSchema>;
export type DefinirVariavelInput = z.infer<typeof DefinirVariavelSchema>;
export type FinalizarFluxoInput = z.infer<typeof FinalizarFluxoSchema>;
export type ContextoParams = z.infer<typeof ContextoParamsSchema>;
export type FluxoParams = z.infer<typeof FluxoParamsSchema>;
export type ExecucaoFluxoResponse = z.infer<typeof ExecucaoFluxoResponseSchema>;
export type EstadoFluxoResponse = z.infer<typeof EstadoFluxoResponseSchema>;
export type ValidacaoFluxoResponse = z.infer<typeof ValidacaoFluxoResponseSchema>;
export type EstatisticasFluxoResponse = z.infer<typeof EstatisticasFluxoResponseSchema>;
