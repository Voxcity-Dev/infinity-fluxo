import type { PrismaClient } from '@prisma/client';

export async function createEtapa(prisma: PrismaClient, fluxos: { fluxoPrincipal: string; fluxoSecundario: string }) {
	console.log('Criando etapas...');

	const tenant_id = '123e4567-e89b-12d3-a456-426614174000';

	// Dados já foram limpos no run.ts

	// Buscar interações criadas para associar às etapas
	const interacoes = await prisma.interacoes.findMany({
		where: { tenant_id },
		orderBy: { created_at: 'asc' },
		select: { id: true },
	});

	// Criar etapas com interações associadas
	const etapas = await prisma.etapas.createMany({
		data: [
			// Fluxo principal
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Início do Atendimento Principal',
				tipo: 'INICIO',
				interacoes_id: interacoes[0].id, 
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoPrincipal,
				nome: 'Coleta de Problema Principal',
				tipo: 'DIALOGO',
				interacoes_id: interacoes[1].id, 
			},
			{
				tenant_id,
				fluxo_id: fluxos.fluxoSecundario,
				nome: 'Fluxo Secundário',
				tipo: 'INICIO',
				interacoes_id: interacoes[2].id, 
			}
		],
	});

	console.log(`${etapas.count} etapas criadas com sucesso`);
}
