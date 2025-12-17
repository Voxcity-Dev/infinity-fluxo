import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Carrega variáveis de ambiente do .env
process.loadEnvFile();

// Verificar variáveis obrigatórias
if (!process.env.DATABASE_URL) {
	console.error('❌ DATABASE_URL não está configurado no .env');
	process.exit(1);
}

if (!process.env.DATABASE_URL_CORE) {
	console.error('❌ DATABASE_URL_CORE não está configurado no .env');
	console.error('');
	console.error('Adicione no .env do infinity-fluxo:');
	console.error('DATABASE_URL_CORE="postgresql://USER:PASS@HOST:PORT/infinity_core"');
	console.error('');
	console.error('Exemplo (mesmo servidor):');
	console.error('DATABASE_URL_CORE="postgresql://core:SENHA@localhost:5432/core?schema=public"');
	process.exit(1);
}

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
			console.log('Tabela nps_filas não existe. Criando via SQL...\n');

			// Criar tabela nps_filas
			await prisma.$executeRaw`
				CREATE TABLE nps_filas (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					tenant_id UUID NOT NULL,
					nps_id UUID NOT NULL,
					fila_atendimento_id UUID NOT NULL,
					is_deleted BOOLEAN NOT NULL DEFAULT false,
					created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
					updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
					CONSTRAINT fk_nps_filas_nps FOREIGN KEY (nps_id) REFERENCES nps(id) ON DELETE CASCADE ON UPDATE CASCADE
				)
			`;

			// Criar índices
			await prisma.$executeRaw`CREATE INDEX idx_nps_filas_tenant_id ON nps_filas(tenant_id)`;
			await prisma.$executeRaw`CREATE INDEX idx_nps_filas_nps_id ON nps_filas(nps_id)`;
			await prisma.$executeRaw`CREATE INDEX idx_nps_filas_fila_atendimento_id ON nps_filas(fila_atendimento_id)`;
			await prisma.$executeRaw`CREATE INDEX idx_nps_filas_is_deleted ON nps_filas(is_deleted)`;

			console.log('✅ Tabela nps_filas criada com sucesso!\n');
		} else {
			console.log('✅ Tabela nps_filas já existe.\n');
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
					// Verificar se já existe vínculo ativo (usando SQL raw)
					const existente = await prisma.$queryRaw<{ id: string }[]>`
						SELECT id FROM nps_filas
						WHERE nps_id = ${npsSetor.nps_id}::uuid
						AND fila_atendimento_id = ${fila.id}::uuid
						AND is_deleted = false
						LIMIT 1
					`;

					if (existente.length > 0) {
						console.log(`    ⏭️ Vínculo NPS-Fila já existe para fila ${fila.id}`);
						continue;
					}

					// Criar novo vínculo (usando SQL raw)
					await prisma.$executeRaw`
						INSERT INTO nps_filas (tenant_id, nps_id, fila_atendimento_id)
						VALUES (${npsSetor.tenant_id}::uuid, ${npsSetor.nps_id}::uuid, ${fila.id}::uuid)
					`;

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
