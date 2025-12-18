import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Removendo registros antigos de expiração NPS do FluxoConfiguracao...');

    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM "FluxoConfiguracao"
      WHERE chave IN (
        'EXPIRACAO_NPS_HABILITADA',
        'EXPIRACAO_NPS_HORAS',
        'EXPIRACAO_NPS_MENSAGEM',
        'EXPIRACAO_NPS_SILENCIOSO'
      )
    `);

    console.log(`Registros removidos: ${result}`);
    console.log('Limpeza concluída! Agora execute: npx prisma db push');
  } catch (error) {
    console.error('Erro ao limpar registros:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();