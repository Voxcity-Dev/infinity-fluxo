import type { PrismaClient } from '@prisma/client';

export async function createTransacao(prisma: PrismaClient, fluxos: { fluxoPrincipal: string; fluxoSecundario: string }) {
	console.log('Criando transações e regras...');

	const tenant_id = '123e4567-e89b-12d3-a456-426614174000';

	// Dados já foram limpos no run.ts

	// Buscar etapas criadas
	const etapas = await prisma.etapas.findMany({
		where: { tenant_id },
		orderBy: { created_at: 'asc' }
	});

	// Mapear etapas por nome para facilitar referência
	const etapasMap = etapas.reduce((acc, etapa) => {
		acc[etapa.nome] = etapa.id;
		return acc;
	}, {} as Record<string, string>);

	// ========== TRANSAÇÕES DO FLUXO PRINCIPAL ==========

	// Transação 1: START -> Boas-vindas
	const transacao1 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Início do Atendimento'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao1.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Boas-vindas'],
			priority: 1,
		},
	});

	// Transação 2: Boas-vindas -> Menu
	const transacao2 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Boas-vindas'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao2.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Menu de Opções'],
			priority: 1,
		},
	});

	// Transação 3: Menu -> Departamentos
	const transacao3 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Menu de Opções'],
		},
	});

	// Regras do menu
	await prisma.transacaoRegra.createMany({
		data: [
			{
				transacao_id: transacao3.id,
				tenant_id,
				input: '1',
				action: 'GO_TO_ETAPA',
				next_etapa_id: etapasMap['Suporte Técnico'],
				priority: 1,
			},
			{
				transacao_id: transacao3.id,
				tenant_id,
				input: '2',
				action: 'GO_TO_ETAPA',
				next_etapa_id: etapasMap['Vendas'],
				priority: 2,
			},
			{
				transacao_id: transacao3.id,
				tenant_id,
				input: '3',
				action: 'GO_TO_ETAPA',
				next_etapa_id: etapasMap['Financeiro'],
				priority: 3,
			},
			{
				transacao_id: transacao3.id,
				tenant_id,
				input: '4',
				action: 'GO_TO_ETAPA',
				next_etapa_id: etapasMap['Transferir Atendente'],
				priority: 4,
			},
			{
				transacao_id: transacao3.id,
				tenant_id,
				input: '*',
				action: 'GO_TO_ETAPA',
				next_etapa_id: etapasMap['Menu de Opções'],
				priority: 99,
			},
		],
	});

	// Transação 4: Suporte Técnico -> Fluxo Secundário
	const transacao4 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Suporte Técnico'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao4.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_FLUXO',
			next_fluxo_id: fluxos.fluxoSecundario,
			priority: 1,
		},
	});

	// Transação 5: Vendas -> Finalização
	const transacao5 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Vendas'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao5.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Finalização'],
			priority: 1,
		},
	});

	// Transação 6: Financeiro -> Finalização
	const transacao6 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Financeiro'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao6.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Finalização'],
			priority: 1,
		},
	});

	// Transação 7: Transferir Atendente -> Finalização
	const transacao7 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Transferir Atendente'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao7.id,
			tenant_id,
			input: '*',
			action: 'SEND_TO_QUEUE',
			queue_id: '123e4567-e89b-12d3-a456-426614174001',
			next_etapa_id: etapasMap['Finalização'],
			priority: 1,
		},
	});

	// ========== TRANSAÇÕES DO FLUXO SECUNDÁRIO ==========

	// Transação 8: START Suporte -> Coleta de Problema
	const transacao8 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Início Suporte Técnico'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao8.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Coleta de Problema'],
			priority: 1,
		},
	});

	// Transação 9: Coleta de Problema -> Finalização
	const transacao9 = await prisma.transacao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Coleta de Problema'],
		},
	});

	await prisma.transacaoRegra.create({
		data: {
			transacao_id: transacao9.id,
			tenant_id,
			input: '*',
			action: 'GO_TO_ETAPA',
			next_etapa_id: etapasMap['Finalização Suporte'],
			priority: 1,
		},
	});

	console.log('9 transações criadas com 12 regras de transição');
	console.log('Fluxo principal: 7 transações');
	console.log('Fluxo secundário: 2 transações');
	console.log('Regras implementadas: GO_TO_ETAPA, GO_TO_FLUXO, SEND_TO_QUEUE');
}
