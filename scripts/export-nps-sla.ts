/**
 * Script de migração NPS/SLA: lê do DB local e envia via HTTP para o mensageria
 *
 * Uso (no servidor do fluxo):
 *   MENSAGERIA_URL="https://api-gateway.voxcity.com.br/mensageria" npm run export:nps-sla
 *
 * Ou com URL direta:
 *   MENSAGERIA_URL="http://186.237.57.215:3000" npm run export:nps-sla
 *
 * Variáveis:
 *   - DATABASE_URL: banco do fluxo (já no .env do servidor)
 *   - MENSAGERIA_URL: URL base do mensageria API
 *   - MIGRATION_SECRET: secret para autenticar (default: nps-sla-migrate-2026)
 *
 * O script é idempotente — seguro re-executar (mensageria usa skipDuplicates)
 */

import { Client } from 'pg';
import axios from 'axios';

const BATCH_SIZE = 500;

async function sendBatch(
	baseUrl: string,
	secret: string,
	table: string,
	data: Record<string, any>[],
): Promise<number> {
	const resp = await axios.post(
		`${baseUrl}/migration/import`,
		{ table, data, secret },
		{
			headers: { 'x-migration-key': secret },
			timeout: 60000,
			maxContentLength: 50 * 1024 * 1024,
			maxBodyLength: 50 * 1024 * 1024,
		},
	);
	return resp.data?.inserted ?? 0;
}

async function migrateTable(
	client: Client,
	baseUrl: string,
	secret: string,
	table: string,
	query: string,
): Promise<{ total: number; inserted: number }> {
	console.log(`--- ${table} ---`);
	const { rows } = await client.query(query);
	console.log(`  DB fonte: ${rows.length} registros`);

	if (rows.length === 0) {
		return { total: 0, inserted: 0 };
	}

	let totalInserted = 0;
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		const batch = rows.slice(i, i + BATCH_SIZE);
		const batchNum = Math.floor(i / BATCH_SIZE) + 1;
		const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

		try {
			const inserted = await sendBatch(baseUrl, secret, table, batch);
			totalInserted += inserted;
			console.log(`  Batch ${batchNum}/${totalBatches}: ${inserted} novos de ${batch.length}`);
		} catch (err: any) {
			const msg = err.response?.data?.message || err.message;
			console.error(`  Batch ${batchNum}/${totalBatches} FALHOU: ${msg}`);
			throw err;
		}
	}

	console.log(`  Total: ${totalInserted} inseridos de ${rows.length}\n`);
	return { total: rows.length, inserted: totalInserted };
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('DATABASE_URL não definida no .env');
		process.exit(1);
	}

	const mensageriaUrl = process.env.MENSAGERIA_URL;
	if (!mensageriaUrl) {
		console.error('MENSAGERIA_URL não definida. Ex:');
		console.error(
			'  MENSAGERIA_URL="https://api-gateway.voxcity.com.br/mensageria" npm run export:nps-sla',
		);
		process.exit(1);
	}

	const secret = process.env.MIGRATION_SECRET || 'nps-sla-migrate-2026';

	console.log('=== Migração NPS + SLA: fluxo → mensageria (via HTTP) ===');
	console.log(`  Destino: ${mensageriaUrl}`);
	console.log(`  Batches de ${BATCH_SIZE} registros\n`);

	// Testar conexão com mensageria
	try {
		await axios.post(
			`${mensageriaUrl}/migration/import`,
			{ table: 'test', data: [], secret },
			{ headers: { 'x-migration-key': secret }, timeout: 10000 },
		);
		console.log('Conexão com mensageria OK\n');
	} catch (err: any) {
		if (err.response?.status === 401) {
			console.error('MIGRATION_SECRET incorreto. Verifique o secret no mensageria.');
			process.exit(1);
		}
		// Status 200 com "skipped" é OK (empty data)
		if (!err.response) {
			console.error(`Não foi possível conectar ao mensageria: ${err.message}`);
			process.exit(1);
		}
		console.log('Conexão com mensageria OK\n');
	}

	const client = new Client({ connectionString: databaseUrl });
	await client.connect();
	console.log('Conectado ao banco do fluxo\n');

	try {
		const results: Record<string, { total: number; inserted: number }> = {};

		// Ordem importa: NPS primeiro (FK), depois respostas e filas
		results.slas = await migrateTable(
			client, mensageriaUrl, secret, 'slas',
			'SELECT * FROM slas ORDER BY created_at ASC',
		);

		results.nps = await migrateTable(
			client, mensageriaUrl, secret, 'nps',
			'SELECT * FROM nps ORDER BY created_at ASC',
		);

		results.nps_respostas = await migrateTable(
			client, mensageriaUrl, secret, 'nps_respostas',
			'SELECT * FROM nps_respostas ORDER BY created_at ASC',
		);

		results.nps_filas = await migrateTable(
			client, mensageriaUrl, secret, 'nps_filas',
			'SELECT * FROM nps_filas ORDER BY created_at ASC',
		);

		// Resumo
		console.log('=== RESUMO ===');
		for (const [table, r] of Object.entries(results)) {
			console.log(`  ${table.padEnd(16)} ${r.total} enviados → ${r.inserted} novos`);
		}
		console.log('\nMigração concluída com sucesso!');
	} catch (error) {
		console.error('\nMigração falhou. O script é idempotente — pode re-executar.');
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
