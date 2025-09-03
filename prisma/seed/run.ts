import { PrismaClient } from '@prisma/client';
import { createFluxo } from './dev/fluxo';
import { createEtapa } from './dev/etapa';
import { createTransacao } from './dev/transacao';
import { createInteracoes } from './dev/interacao';

const prisma = new PrismaClient();

async function main() {
	const nodeEnv = 'development'; // Sempre usar desenvolvimento para seeds

	console.log(`Iniciando o seeding para o ambiente: ${nodeEnv}`);

	console.log('--- Executando Seeders Comuns ---');

	const seeders = {
		development: async () => {
			console.log('--- Executando Seeders de Desenvolvimento ---');

			// Limpar dados na ordem correta (respeitando foreign keys)
			await prisma.transacaoRegra.deleteMany({});
			await prisma.transacao.deleteMany({});
			await prisma.etapas.deleteMany({});
			await prisma.interacoes.deleteMany({});
			await prisma.fluxoConfiguracao.deleteMany({});
			await prisma.fluxo.deleteMany({});

			const fluxos = await createFluxo(prisma);
			await createInteracoes(prisma);
			await createEtapa(prisma, fluxos);
			await createTransacao(prisma, fluxos);
		},
		production: async () => {
			console.log('--- Executando Seeders de Produção ---');
		},
	};

	if (seeders[nodeEnv]) {
		await seeders[nodeEnv]();
		console.log('Seeding finalizado com sucesso!');
	} else {
		console.error(`Seeders para o ambiente ${nodeEnv} não encontrados!`);
		process.exit(1);
	}
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
