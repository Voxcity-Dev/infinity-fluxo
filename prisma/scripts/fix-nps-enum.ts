import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

process.loadEnvFile();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Removendo registros antigos de expiração NPS do FluxoConfiguracao...');

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "FluxoConfiguracao"
      WHERE chave IN (
        'EXPIRACAO_NPS_HABILITADA',
        'EXPIRACAO_NPS_HORAS',
        'EXPIRACAO_NPS_MENSAGEM',
        'EXPIRACAO_NPS_SILENCIOSO'
      )
    `;

    console.log(`Registros removidos: ${result}`);
    console.log('Limpeza concluída!');
  } catch (error) {
    console.error('Erro ao limpar registros:', error);
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