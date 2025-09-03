// Script para obter os IDs dos fluxos criados pelo seed
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getFluxoIds() {
  try {
    console.log('🔍 Buscando IDs dos fluxos...\n');
    
    const fluxos = await prisma.fluxo.findMany({
      where: {
        tenant_id: '123e4567-e89b-12d3-a456-426614174000'
      },
      select: {
        id: true,
        nome: true,
        created_at: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    if (fluxos.length === 0) {
      console.log('❌ Nenhum fluxo encontrado. Execute primeiro: npm run seed:dev');
      return;
    }

    console.log('📋 Fluxos encontrados:\n');
    
    fluxos.forEach((fluxo, index) => {
      console.log(`${index + 1}. ${fluxo.nome}`);
      console.log(`   ID: ${fluxo.id}`);
      console.log(`   Criado em: ${fluxo.created_at.toISOString()}\n`);
    });

    console.log('🔧 Para usar nos testes HTTP:');
    console.log(`   Fluxo Principal: ${fluxos[0].id}`);
    if (fluxos[1]) {
      console.log(`   Fluxo Secundário: ${fluxos[1].id}`);
    }

    console.log('\n📝 Copie estes IDs para o arquivo test/request.http');
    console.log('   Substitua {fluxo_id} e {fluxo_secundario_id} pelos IDs acima');

  } catch (error) {
    console.error('❌ Erro ao buscar fluxos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getFluxoIds();
