import type { PrismaClient } from '@prisma/client';

export async function createFluxo(prisma: PrismaClient) {
	console.log('Criando fluxos...');

	const tenant_id = '123e4567-e89b-12d3-a456-426614174000';

	// Dados já foram limpos no run.ts

	// Criar fluxo principal de atendimento
	const fluxo = await prisma.fluxo.create({
		data: {
			tenant_id,
			nome: 'Fluxo de Atendimento Principal',
		},
	});

	// Criar configurações do fluxo
	await prisma.fluxoConfiguracao.createMany({
		data: [
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'ENVIA_MENSAGEM',
				valor: 'Você foi direcionado para atendimento humano. Aguarde um momento...',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'MENSAGEM_INVALIDA',
				valor: 'Desculpe, não entendi sua resposta. Por favor, escolha uma das opções válidas.',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'TEMPO_MAXIMO',
				valor: '10',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'FILA_PADRAO',
				valor: 'queue-geral',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'USUARIO_PADRAO',
				valor: 'user-atendente-001',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'MAXIMO_TENTATIVAS',
				valor: '3',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'DISTRIBUICAO_AUTOMATICA',
				valor: 'NONE',
			},
			{
				tenant_id,
				fluxo_id: fluxo.id,
				chave: 'ENCERRAR_FLUXO_CONDIÇÃO',
				valor: 'true',
			},
		],
	});

	// Criar fluxo secundário
	const fluxoSecundario = await prisma.fluxo.create({
		data: {
			tenant_id,
			nome: 'Fluxo de Suporte Técnico',
		},
	});

	// Configurações do fluxo secundário
	await prisma.fluxoConfiguracao.createMany({
		data: [
			{
				tenant_id,
				fluxo_id: fluxoSecundario.id,
				chave: 'ENVIA_MENSAGEM',
				valor: 'Você foi direcionado para o suporte técnico especializado.',
			},
			{
				tenant_id,
				fluxo_id: fluxoSecundario.id,
				chave: 'MENSAGEM_INVALIDA',
				valor: 'Fluxo 2 - Desculpe, não entendi sua resposta. Por favor, escolha uma das opções válidas.',
			},
			{
				tenant_id,
				fluxo_id: fluxoSecundario.id,
				chave: 'TEMPO_MAXIMO',
				valor: '15',
			},
			{
				tenant_id,
				fluxo_id: fluxoSecundario.id,
				chave: 'FILA_PADRAO',
				valor: 'queue-suporte-tecnico',
			},
			{
				tenant_id,
				fluxo_id: fluxoSecundario.id,
				chave: 'MAXIMO_TENTATIVAS',
				valor: '2',
			},
		],
	});

	console.log(`2 fluxos criados com 13 configurações`);
	
	// Retornar os IDs dos fluxos para usar nas outras seeds
	return {
		fluxoPrincipal: fluxo.id,
		fluxoSecundario: fluxoSecundario.id,
	};
}
