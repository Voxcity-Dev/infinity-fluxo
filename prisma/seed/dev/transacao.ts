import type { PrismaClient } from '@prisma/client';

export async function createTransacao(prisma: PrismaClient) {
	console.log('Criando transações...');

	console.log('Transações criadas com sucesso');
}
