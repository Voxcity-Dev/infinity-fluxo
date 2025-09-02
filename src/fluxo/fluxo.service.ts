import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import type { UpdateFluxoInput } from './dto/update-fluxo.dto';
import type { ListFluxosInput } from './dto/list-fluxo.dto';
import type { CreateFlowConfiguracao, UpdateFlowConfiguracao } from 'src/schemas/fluxo.schema';

@Injectable()
export class FluxoService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateFluxoInput) {
		try {
			const fluxo = await this.prisma.fluxo.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
				},
			});

			return fluxo;
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === 'P2002' &&
				(error.meta?.target as string[])?.includes('tenant_id') &&
				(error.meta?.target as string[])?.includes('nome')
			) {
				throw new BadRequestException('Já existe um fluxo com este nome para este tenant');
			}

			console.error('Erro ao criar fluxo:', error);
			throw new BadRequestException('Erro ao criar fluxo');
		}
	}

	async findAll(params: ListFluxosInput) {
		const { tenant_id, page, limit, search } = params;
		const skip = (page - 1) * limit;

		const where = {
			tenant_id,
			...(search && {
				nome: {
					contains: search,
					mode: 'insensitive' as const,
				},
			}),
		};

		const [fluxos, total] = await Promise.all([
			this.prisma.fluxo.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
			}),
			this.prisma.fluxo.count({ where }),
		]);

		return {
			data: fluxos,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(id: string, tenant_id: string) {
		const fluxo = await this.prisma.fluxo.findFirst({
			where: {
				id,
				tenant_id,
			},
			include: {
				etapas: {
					select: {
						id: true,
						nome: true,
						tipo: true,
						created_at: true,
					},
				},
				configuracoes: {
					select: {
						id: true,
						chave: true,
						valor: true,
						created_at: true,
					},
				},
			},
		});

		if (!fluxo) {
			throw new NotFoundException('Fluxo não encontrado');
		}

		return fluxo;
	}

	async update(id: string, tenant_id: string, data: UpdateFluxoInput) {
		try {
			const fluxo = await this.prisma.fluxo.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return fluxo;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Fluxo não encontrado');
			}

			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === 'P2002' &&
				(error.meta?.target as string[])?.includes('tenant_id') &&
				(error.meta?.target as string[])?.includes('nome')
			) {
				throw new BadRequestException('Já existe um fluxo com este nome para este tenant');
			}

			console.error('Erro ao atualizar fluxo:', error);
			throw new BadRequestException('Erro ao atualizar fluxo');
		}
	}

	async remove(id: string, tenant_id: string) {
		try {
			await this.prisma.fluxo.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Fluxo removido com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Fluxo não encontrado');
			}

			console.error('Erro ao remover fluxo:', error);
			throw new BadRequestException('Erro ao remover fluxo');
		}
	}

	// Métodos para configurações do fluxo
	async createConfiguracao(data: CreateFlowConfiguracao) {
		try {
			const configuracao = await this.prisma.fluxoConfiguracao.create({
				data: {
					tenant_id: data.tenant_id,
					fluxo_id: data.fluxo_id,
					chave: data.chave,
					valor: data.valor,
				},
			});

			return configuracao;
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === 'P2002' &&
				(error.meta?.target as string[])?.includes('tenant_id') &&
				(error.meta?.target as string[])?.includes('fluxo_id') &&
				(error.meta?.target as string[])?.includes('chave')
			) {
				throw new BadRequestException('Já existe uma configuração com esta chave para este fluxo');
			}

			console.error('Erro ao criar configuração:', error);
			throw new BadRequestException('Erro ao criar configuração');
		}
	}

	async findAllConfiguracoes(fluxo_id: string, tenant_id: string) {
		const configuracoes = await this.prisma.fluxoConfiguracao.findMany({
			where: {
				fluxo_id,
				tenant_id,
			},
			orderBy: { created_at: 'desc' },
		});

		return configuracoes;
	}

	async findOneConfiguracao(id: string, tenant_id: string) {
		const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
			where: {
				id,
				tenant_id,
			},
		});

		if (!configuracao) {
			throw new NotFoundException('Configuração não encontrada');
		}

		return configuracao;
	}

	async updateConfiguracao(id: string, tenant_id: string, data: UpdateFlowConfiguracao) {
		try {
			const configuracao = await this.prisma.fluxoConfiguracao.update({
				where: {
					id,
					tenant_id,
				},
				data,
			});

			return configuracao;
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Configuração não encontrada');
			}

			console.error('Erro ao atualizar configuração:', error);
			throw new BadRequestException('Erro ao atualizar configuração');
		}
	}

	async removeConfiguracao(id: string, tenant_id: string) {
		try {
			await this.prisma.fluxoConfiguracao.delete({
				where: {
					id,
					tenant_id,
				},
			});

			return { message: 'Configuração removida com sucesso' };
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException('Configuração não encontrada');
			}

			console.error('Erro ao remover configuração:', error);
			throw new BadRequestException('Erro ao remover configuração');
		}
	}
}
