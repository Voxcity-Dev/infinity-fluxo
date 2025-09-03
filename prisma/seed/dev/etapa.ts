import type { PrismaClient } from '@prisma/client';

export async function createEtapa(prisma: PrismaClient, fluxos: { fluxoPrincipal: string; fluxoSecundario: string }) {
	console.log('Criando etapas...');

	const tenant_id = '123e4567-e89b-12d3-a456-426614174000';

	// Dados já foram limpos no run.ts

	// Buscar interações criadas para associar às etapas
	const interacoes = await prisma.interacoes.findMany({
		where: { tenant_id },
		orderBy: { created_at: 'asc' }
	});

	// Criar etapas com interações associadas
	const etapas = await prisma.etapas.createMany({
		data: [
			// Fluxo principal
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Início do Atendimento',
				tipo: 'START',
				interacoes_id: [],
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Boas-vindas',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[0].id], // Olá! Bem-vindo...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Menu de Opções',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[1].id], // Escolha uma das opções...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Suporte Técnico',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[5].id], // Suporte técnico...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Vendas',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[6].id], // Vendas...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Financeiro',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[7].id], // Financeiro...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Transferir Atendente',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[8].id], // Transferir para atendente...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Finalização',
				tipo: 'END',
				interacoes_id: [interacoes[9].id], // Obrigado por entrar...
			},
			// Fluxo secundário
			{
				tenant_id,
				fluxo_id: fluxos.fluxoSecundario,
				nome: 'Início Suporte Técnico',
				tipo: 'START',
				interacoes_id: [],
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoSecundario,
				nome: 'Coleta de Problema',
				tipo: 'DIALOG',
				interacoes_id: [interacoes[5].id], // Suporte técnico...
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoSecundario,
				nome: 'Finalização Suporte',
				tipo: 'END',
				interacoes_id: [interacoes[9].id], // Obrigado por entrar...
			},
		],
	});

	console.log(`11 etapas criadas com sucesso`);
}
