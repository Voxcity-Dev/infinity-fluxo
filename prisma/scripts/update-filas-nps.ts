import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Carrega variáveis de ambiente do .env
process.loadEnvFile();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pool para o banco infinity-core (para consultar filas)
const corePool = new Pool({ connectionString: process.env.DATABASE_URL_CORE });

async function main() {
	console.log('=== Migração: NPS de Setor para Fila ===\n');

	try {
		// 1. Verificar se a tabela nps_filas existe
		const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.tables
				WHERE table_name = 'nps_filas'
			) as exists
		`;

		if (!tableExists[0]?.exists) {
			console.log('Tabela nps_filas não existe. Execute "npx prisma db push" primeiro.');
			process.exit(1);
		}

		// 2. Buscar todos os vínculos NPS-Setor ativos
		const npsSetores = await prisma.npsSetor.findMany({
			where: { is_deleted: false },
		});

		console.log(`Encontrados ${npsSetores.length} vínculos NPS-Setor ativos.\n`);

		if (npsSetores.length === 0) {
			console.log('Nenhum vínculo para migrar.');
			return;
		}

		let migrados = 0;
		let erros = 0;

		for (const npsSetor of npsSetores) {
			try {
				// 3. Buscar filas do setor no banco core
				const filas = await corePool.query<{ id: string }>(
					`SELECT id FROM filas_atendimento
					 WHERE setor_id = $1
					 AND is_deleted = false
					 AND is_active = true`,
					[npsSetor.setor_id]
				);

				if (filas.rows.length === 0) {
					console.log(`  ⚠️ Setor ${npsSetor.setor_id} não tem filas ativas. Pulando...`);
					continue;
				}

				console.log(`  Setor ${npsSetor.setor_id}: ${filas.rows.length} fila(s) encontrada(s)`);

				// 4. Para cada fila, criar vínculo NPS-Fila
				for (const fila of filas.rows) {
					// Verificar se já existe vínculo ativo
					const existente = await prisma.npsFila.findFirst({
						where: {
							nps_id: npsSetor.nps_id,
							fila_atendimento_id: fila.id,
							is_deleted: false,
						},
					});

					if (existente) {
						console.log(`    ⏭️ Vínculo NPS-Fila já existe para fila ${fila.id}`);
						continue;
					}

					// Criar novo vínculo
					await prisma.npsFila.create({
						data: {
							tenant_id: npsSetor.tenant_id,
							nps_id: npsSetor.nps_id,
							fila_atendimento_id: fila.id,
						},
					});

					console.log(`    ✅ Vínculo criado: NPS ${npsSetor.nps_id} -> Fila ${fila.id}`);
					migrados++;
				}
			} catch (error) {
				console.error(`  ❌ Erro ao processar setor ${npsSetor.setor_id}:`, error);
				erros++;
			}
		}

		console.log('\n=== Resultado da Migração ===');
		console.log(`✅ Vínculos criados: ${migrados}`);
		console.log(`❌ Erros: ${erros}`);
		console.log('\nMigração concluída!');
		console.log('\nNOTA: Os vínculos NPS-Setor antigos foram mantidos para retrocompatibilidade.');
		console.log('Após validar a migração, você pode marcá-los como is_deleted=true se necessário.');

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
		await corePool.end();
	});
