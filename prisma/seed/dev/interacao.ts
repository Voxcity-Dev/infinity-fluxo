import type { PrismaClient } from '@prisma/client';

export async function createInteracoes(prisma: PrismaClient) {
	console.log('Criando interações...');

	const tenant_id = '123e4567-e89b-12d3-a456-426614174000';

	// Dados já foram limpos no run.ts

	// Criar interações básicas
	const interacoes = await prisma.interacoes.createMany({
		data: [
			{
				tenant_id,
				nome: 'Boas-vindas',
				tipo: 'MENSAGEM',
				conteudo: 'Por favor, escolha uma das opções:\n1 - Suporte técnico\n2 - Vendas\n3 - Financeiro\n4 - RH',
			},
			{
				tenant_id,
				nome: 'Descrição do Problema',
				tipo: 'MENSAGEM',
				conteudo: 'Para melhor atendê-lo, por favor informe seu problema:',
			},
			{
				tenant_id,
				nome: 'Menu secundário',
				tipo: 'MENSAGEM',
				conteudo: 'Fluxo secundário: Por favor, escolha uma das opções:\n1 - Suporte técnico\n2 - Vendas\n3 - Financeiro\n4 - RH',
			}
		],
	});

	console.log(`${interacoes.count} interações básicas criadas com sucesso para o tenant ${tenant_id}`);
	
	// TODO: Implementar interações para SET_VARIABLE
	// TODO: Implementar interações para API_CALL  
	// TODO: Implementar interações para DB_QUERY
}
