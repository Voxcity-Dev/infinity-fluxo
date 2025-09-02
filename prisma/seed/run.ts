import { PrismaClient } from '@prisma/client';
import { createFluxo } from './dev/fluxo';
import { createEtapa } from './dev/etapa';
import { createTransacao } from './dev/transacao';
import { createInteracoes } from './dev/interacao';

const prisma = new PrismaClient();

async function main() {
	const nodeEnv = process.env.NODE_ENV || 'development';

	console.log(`Iniciando o seeding para o ambiente: ${nodeEnv}`);

	console.log('--- Executando Seeders Comuns ---');

	const seeders = {
		development: async () => {
			console.log('--- Executando Seeders de Desenvolvimento ---');

			await createFluxo(prisma);
			await createEtapa(prisma);
			await createTransacao(prisma);
			await createInteracoes(prisma);
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
