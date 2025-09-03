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
				nome: 'Interação 1',
				tipo: 'MESSAGE',
				conteudo: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
			},
			{
				tenant_id,
				nome: 'Interação 2',
				tipo: 'MESSAGE',
				conteudo: 'Por favor, escolha uma das opções:\n1 - Suporte técnico\n2 - Vendas\n3 - Financeiro\n4 - Falar com atendente',
			},
			{
				tenant_id,
				nome: 'Interação 3',
				tipo: 'MESSAGE',
				conteudo: 'Para melhor atendê-lo, por favor informe seu nome completo:',
			},
			{
				tenant_id,
				nome: 'Interação 4',
				tipo: 'MESSAGE',
				conteudo: 'Agora informe seu e-mail para contato:',
			},
			{
				tenant_id,
				nome: 'Interação 5',
				tipo: 'MESSAGE',
				conteudo: 'Obrigado! Seus dados foram registrados com sucesso. Você será direcionado para o departamento escolhido.',
			},
			{
				tenant_id,
				nome: 'Interação 6',
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para o Suporte Técnico. Descreva brevemente seu problema:',
			},
			{
				tenant_id,
				nome: 'Interação 7',
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para Vendas. Qual produto ou serviço tem interesse?',
			},
			{
				tenant_id,
				nome: 'Interação 8',
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para o Financeiro. Qual é sua dúvida sobre pagamentos ou cobrança?',
			},
			{
				tenant_id,
				nome: 'Interação 9',
				tipo: 'MESSAGE',
				conteudo: 'Você será transferido para um de nossos atendentes. Aguarde um momento...',
			},
			{
				tenant_id,
				nome: 'Interação 10',
				tipo: 'MESSAGE',
				conteudo: 'Obrigado por entrar em contato! Seu atendimento foi registrado. Tenha um ótimo dia!',
			},
			{
				tenant_id,
				nome: 'Interação 11',
				tipo: 'MESSAGE',
				conteudo: 'Desculpe, não entendi sua resposta. Por favor, escolha uma das opções válidas.',
			},
		],
	});

	console.log(`11 interações básicas criadas com sucesso para o tenant ${tenant_id}`);
	
	// TODO: Implementar interações para SET_VARIABLE
	// TODO: Implementar interações para API_CALL  
	// TODO: Implementar interações para DB_QUERY
}
