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
				tipo: 'MESSAGE',
				conteudo: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Por favor, escolha uma das opções:\n1 - Suporte técnico\n2 - Vendas\n3 - Financeiro\n4 - Falar com atendente',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Para melhor atendê-lo, por favor informe seu nome completo:',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Agora informe seu e-mail para contato:',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Obrigado! Seus dados foram registrados com sucesso. Você será direcionado para o departamento escolhido.',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para o Suporte Técnico. Descreva brevemente seu problema:',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para Vendas. Qual produto ou serviço tem interesse?',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Você foi direcionado para o Financeiro. Qual é sua dúvida sobre pagamentos ou cobrança?',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Você será transferido para um de nossos atendentes. Aguarde um momento...',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Obrigado por entrar em contato! Seu atendimento foi registrado. Tenha um ótimo dia!',
			},
			{
				tenant_id,
				tipo: 'MESSAGE',
				conteudo: 'Desculpe, não entendi sua resposta. Por favor, escolha uma das opções válidas.',
			},
		],
	});

	console.log(`11 interações básicas criadas com sucesso`);
	
	// TODO: Implementar interações para SET_VARIABLE
	// TODO: Implementar interações para API_CALL  
	// TODO: Implementar interações para DB_QUERY
}
