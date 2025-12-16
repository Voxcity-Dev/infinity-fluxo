import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Carrega variáveis de ambiente do .env
process.loadEnvFile();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('=== Fix: Adicionar índice único [fluxo_id, chave] na tabela fluxo_configuracoes ===\n');

	try {
		// Verificar se o índice já existe
		const indexExists = await prisma.$queryRaw<{ exists: boolean }[]>`
			SELECT EXISTS (
				SELECT 1 FROM pg_indexes
				WHERE tablename = 'fluxo_configuracoes'
				AND indexname = 'fluxo_configuracoes_fluxo_id_chave_key'
			) as exists
		`;

		if (indexExists[0]?.exists) {
			console.log('Índice já existe. Nenhuma alteração necessária.');
			return;
		}

		// Verificar se há duplicatas que impediriam a criação do índice único
		const duplicatas = await prisma.$queryRaw<{ fluxo_id: string; chave: string; count: bigint }[]>`
			SELECT fluxo_id, chave, COUNT(*) as count
			FROM fluxo_configuracoes
			GROUP BY fluxo_id, chave
			HAVING COUNT(*) > 1
		`;

		if (duplicatas.length > 0) {
			console.log('ATENÇÃO: Existem duplicatas que precisam ser resolvidas antes de criar o índice único:\n');
			for (const dup of duplicatas) {
				console.log(`  - fluxo_id: ${dup.fluxo_id}, chave: ${dup.chave}, quantidade: ${dup.count}`);
			}
			console.log('\nRemovendo duplicatas (mantendo o registro mais recente)...');

			// Remover duplicatas mantendo o registro mais recente
			await prisma.$executeRaw`
				DELETE FROM fluxo_configuracoes a
				USING fluxo_configuracoes b
				WHERE a.fluxo_id = b.fluxo_id
				AND a.chave = b.chave
				AND a.updated_at < b.updated_at
			`;

			console.log('Duplicatas removidas.\n');
		}

		// Criar o índice único
		console.log('Criando índice único [fluxo_id, chave]...');
		await prisma.$executeRaw`
			CREATE UNIQUE INDEX "fluxo_configuracoes_fluxo_id_chave_key"
			ON "fluxo_configuracoes" ("fluxo_id", "chave")
		`;

		console.log('\nÍndice único criado com sucesso!');
	} catch (error) {
		console.error('Erro ao executar script:', error);
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
		await pool.end();
	});