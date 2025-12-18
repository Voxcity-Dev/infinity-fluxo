import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Carrega variáveis de ambiente do .env
process.loadEnvFile();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('=== Limpeza: Remover registros is_deleted=true da tabela nps_filas ===\n');

	try {
		// Contar registros que serão removidos
		const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
			SELECT COUNT(*) as count FROM nps_filas WHERE is_deleted = true
		`;

		const count = Number(countResult[0]?.count || 0);

		if (count === 0) {
			console.log('Nenhum registro com is_deleted=true encontrado. Nada a fazer.');
			return;
		}

		console.log(`Encontrados ${count} registro(s) com is_deleted=true.`);
		console.log('Removendo registros...\n');

		// Deletar registros com is_deleted = true
		const deleted = await prisma.$executeRaw`
			DELETE FROM nps_filas WHERE is_deleted = true
		`;

		console.log(`${deleted} registro(s) removido(s) com sucesso!`);
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