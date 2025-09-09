import type { PrismaClient } from '@prisma/client';

export async function createCondicao(prisma: PrismaClient, fluxos: { fluxoPrincipal: string; fluxoSecundario: string }) {
	console.log('Criando condições e regras...');

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

	// ========== CONDIÇÕES DO FLUXO PRINCIPAL ==========

	// Condição 1: START -> Boas-vindas
	const condicao_principal = await prisma.condicao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Início do Atendimento Principal'],
		},
	});

	// Regras do menu
	await prisma.condicaoRegra.createMany({
		data: [
			{
				condicao_id: condicao_principal.id,
				tenant_id,
				input: '1',
				msg_exata: true,
				action: 'ETAPA',
				next_etapa_id: etapasMap['Coleta de Problema Principal'],
				priority: 1,
			},
			{
				condicao_id: condicao_principal.id,
				tenant_id,
				input: '2',
				msg_exata: true,
				action: 'FLUXO',
				next_fluxo_id: fluxos.fluxoSecundario,
				priority: 2,
			},
			{
				condicao_id: condicao_principal.id,
				tenant_id,
				input: '3',
				msg_exata: true,
				action: 'USUARIO',
				user_id: '123e4567-e89b-12d3-a456-426614174001',
				priority: 3,
			},
			{
				condicao_id: condicao_principal.id,
				tenant_id,
				input: '4',
				msg_exata: true,
				action: 'FILA',
				queue_id: '123e4567-e89b-12d3-a456-426614174002',
				priority: 4,
			},
		],
	});

	// CONDIÇÃO ETAPA COLETA DE PROBLEMA PRINCIPAL
	const condicao_etapa_coleta_problema_principal = await prisma.condicao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Coleta de Problema Principal'],
		},
	});

	// Regras do menu COLETA DE PROBLEMA PRINCIPAL
	await prisma.condicaoRegra.createMany({
		data: [
			{
				condicao_id: condicao_etapa_coleta_problema_principal.id,
				tenant_id,
				input: '',
				msg_exata: false,
				action: 'FILA',
				queue_id: '123e4567-e89b-12d3-a456-426614174003',
				priority: 1,
			},
		],
	});


	// CONDIÇÃO FLUXO SECUNDARIO
	const condicao_fluxo_secundario = await prisma.condicao.create({
		data: {
			tenant_id,
			etapa_id: etapasMap['Fluxo Secundário'],
		},
	});

	// Regras do menu FLUXO SECUNDARIO
	await prisma.condicaoRegra.createMany({
		data: [
			{
				condicao_id: condicao_fluxo_secundario.id,
				tenant_id,
				input: '',
				msg_exata: false,
				action: 'FILA',
				queue_id: '123e4567-e89b-12d3-a456-426614174004',
				priority: 1,
			},
		],
	});

	console.log('9 condições criadas com 12 regras de condição');
	console.log('Fluxo principal: 7 condições');
	console.log('Fluxo secundário: 2 condições');
	console.log('Regras implementadas: ETAPA, FLUXO, USUARIO, FILA');
}
