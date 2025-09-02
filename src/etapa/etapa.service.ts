import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { CreateEtapaInput } from './dto/create-etapa.dto';
import type { UpdateEtapaInput } from './dto/update-etapa.dto';
import type { ListEtapasInput } from './dto/list-etapa.dto';
import type { NodeType } from '@prisma/client';

@Injectable()
export class EtapaService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateEtapaInput) {
		try {
			const etapa = await this.prisma.etapas.create({
				data: {
					tenant_id: data.tenant_id,
					fluxo_id: data.fluxo_id,
					nome: data.nome,
					tipo: data.tipo,
					interacoes_id: data.interacoes_id,
				},
			});

			return etapa;
		} catch (error) {
			console.error('Erro ao criar etapa:', error);
			throw new BadRequestException('Erro ao criar etapa');
		}
	}

	async findAll(params: ListEtapasInput) {
		const { tenant_id, fluxo_id, page, limit, search, tipo } = params;
		const skip = (page - 1) * limit;

		const where = {
			tenant_id,
			...(fluxo_id && { fluxo_id }),
			...(search && {
				nome: {
					contains: search,
					mode: 'insensitive' as const,
				},
			}),
			...(tipo && { tipo: tipo as NodeType }),
		};

		const [etapas, total] = await Promise.all([
			this.prisma.etapas.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
			}),
			this.prisma.etapas.count({ where }),
		]);

		return {
			data: etapas,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(id: string, tenant_id: string) {
		const etapa = await this.prisma.etapas.findFirst({
			where: {
				id,
				tenant_id,
			},
		});

		if (!etapa) {
			throw new NotFoundException('Etapa não encontrada');
		}

		return etapa;
	}

	async update(id: string, tenant_id: string, data: UpdateEtapaInput) {
		try {
			const etapa = await this.prisma.etapas.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return etapa;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Etapa não encontrada');
			}

			console.error('Erro ao atualizar etapa:', error);
			throw new BadRequestException('Erro ao atualizar etapa');
		}
	}

	async remove(id: string, tenant_id: string) {
		try {
			await this.prisma.etapas.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Etapa removida com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Etapa não encontrada');
			}

			console.error('Erro ao remover etapa:', error);
			throw new BadRequestException('Erro ao remover etapa');
		}
	}
}
