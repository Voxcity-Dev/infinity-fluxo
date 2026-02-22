/**
 * Script de EXPORTAÇÃO de dados NPS e SLA do infinity-fluxo
 *
 * Uso (no servidor do fluxo):
 *   npm run export:nps-sla
 *
 * Gera 4 arquivos JSON na pasta scripts/:
 *   - nps-export.json
 *   - nps-respostas-export.json
 *   - nps-filas-export.json
 *   - slas-export.json
 *
 * Esses arquivos devem ser copiados para o servidor do mensageria
 * e importados com: npm run migrate:nps-sla
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('DATABASE_URL não definida no .env');
		process.exit(1);
	}

	console.log('=== Exportação NPS + SLA do infinity-fluxo ===\n');

	const client = new Client({ connectionString: databaseUrl });
	await client.connect();
	console.log('Conectado ao banco do fluxo\n');

	const outputDir = path.join(__dirname);

	try {
		// 1. Exportar SLAs
		console.log('--- Exportando SLAs ---');
		const { rows: slas } = await client.query('SELECT * FROM slas ORDER BY created_at ASC');
		fs.writeFileSync(path.join(outputDir, 'slas-export.json'), JSON.stringify(slas, null, 2));
		console.log(`  ${slas.length} registros → slas-export.json`);

		// 2. Exportar NPS
		console.log('--- Exportando NPS ---');
		const { rows: nps } = await client.query('SELECT * FROM nps ORDER BY created_at ASC');
		fs.writeFileSync(path.join(outputDir, 'nps-export.json'), JSON.stringify(nps, null, 2));
		console.log(`  ${nps.length} registros → nps-export.json`);

		// 3. Exportar NPS Respostas
		console.log('--- Exportando NPS Respostas ---');
		const { rows: respostas } = await client.query(
			'SELECT * FROM nps_respostas ORDER BY created_at ASC',
		);
		fs.writeFileSync(
			path.join(outputDir, 'nps-respostas-export.json'),
			JSON.stringify(respostas, null, 2),
		);
		console.log(`  ${respostas.length} registros → nps-respostas-export.json`);

		// 4. Exportar NPS Filas
		console.log('--- Exportando NPS Filas ---');
		const { rows: filas } = await client.query(
			'SELECT * FROM nps_filas ORDER BY created_at ASC',
		);
		fs.writeFileSync(
			path.join(outputDir, 'nps-filas-export.json'),
			JSON.stringify(filas, null, 2),
		);
		console.log(`  ${filas.length} registros → nps-filas-export.json`);

		console.log('\n=== Exportação concluída! ===');
		console.log(`Arquivos gerados em: ${outputDir}`);
		console.log('\nPróximo passo:');
		console.log(
			'  scp scripts/*-export.json MENSAGERIA-SERVER:~/deploy/infinity-mensageria/scripts/',
		);
		console.log('  ssh MENSAGERIA-SERVER');
		console.log('  cd ~/deploy/infinity-mensageria && npm run migrate:nps-sla');
	} catch (error) {
		console.error('\nErro durante exportação:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
