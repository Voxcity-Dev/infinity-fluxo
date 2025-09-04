import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateTransacaoInput } from './dto/create-transacao.dto';
import { ListTransacoesInput } from './dto/list-transacao.dto';

@Injectable()
export class TransacaoService {
	constructor(private readonly prisma: PrismaService) {}

	async find(params: ListTransacoesInput) {
		try {
			const { page, limit, tenant_id, etapa_id } = params;

			const transacoes = await this.prisma.transacao.findMany({
				where: {
					tenant_id,
					etapa_id,
					is_deleted: false,
				},
				include: {
					regras: true,
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			const total = await this.prisma.transacao.count({
				where: {
					tenant_id,
					etapa_id,
					is_deleted: false,
				},
			});

			return {
				data: transacoes,
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error('Erro ao listar transações:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar transações');
		}
	}
}