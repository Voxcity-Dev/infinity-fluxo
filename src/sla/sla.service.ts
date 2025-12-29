import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateSlaInput } from './dto/create-sla.dto';
import { ListSlaInput } from './dto/list-sla.dto';
import { UpdateSlaInput } from './dto/update-sla.dto';
import { Sla, SlaTipo } from '@prisma/client';

@Injectable()
export class SlaService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateSlaInput) {
		try {
			// Verificar se já existe SLA do mesmo tipo para o tenant
			const existingSla = await this.prisma.sla.findFirst({
				where: {
					tenant_id: data.tenant_id,
					tipo: data.tipo,
					is_deleted: false,
				},
			});

			if (existingSla) {
				throw new BadRequestException(`Já existe um SLA do tipo ${data.tipo} para este tenant`);
			}

			const sla = await this.prisma.sla.create({
				data: {
					tenant_id: data.tenant_id,
					tipo: data.tipo,
					tempo: data.tempo || 0,
					meta_conformidade: data.meta_conformidade || 85,
				},
			});

			return sla;
		} catch (error) {
			console.error('Erro ao criar SLA:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao criar SLA');
		}
	}

	async update(data: UpdateSlaInput) {
		try {
			const { tenant_id, tipo, tempo, meta_conformidade } = data;

			// Buscar SLA existente por tenant_id e tipo
			const existingSla = await this.prisma.sla.findFirst({
				where: {
					tenant_id,
					tipo,
					is_deleted: false,
				},
			});

			// Preparar dados de atualização
			const updateData: any = { tempo };
			if (meta_conformidade !== undefined) {
				updateData.meta_conformidade = meta_conformidade;
			}

			// Se existe, atualizar; se não, criar (UPSERT)
			if (existingSla) {
			const sla = await this.prisma.sla.update({
				where: {
						id: existingSla.id,
				},
				data: updateData,
			});

			return sla;
			} else {
				// Criar novo SLA se não existir
				const sla = await this.prisma.sla.create({
					data: {
						tenant_id,
						tipo,
						tempo,
						meta_conformidade: meta_conformidade || 85,
					},
				});

				return sla;
			}
		} catch (error) {
			console.error('Erro ao atualizar SLA:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao atualizar SLA');
		}
	}

	async findAll(params: ListSlaInput) {
		try {
			const { page, limit, tenant_id } = params;

			// Construir objeto de query base
			const queryOptions: any = {
				where: { 
					tenant_id: tenant_id, 
					is_deleted: false,
				},
				orderBy: { created_at: 'desc' },
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const [slas, total] = await Promise.all([
				this.prisma.sla.findMany(queryOptions),
				this.prisma.sla.count({ where: queryOptions.where })
			]);

			const totalPages = Math.ceil(total / limit);

			return {
				data: slas,
				meta: {
					page,
					limit,
					total,
					totalPages,
				}
			};
		} catch (error) {
			console.error('Erro ao listar SLAs:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar SLAs');
		}
	}

	async findByTenant(tenant_id: string) {
		try {
			const tipos: SlaTipo[] = [
				'TEMPO_PRIMEIRA_RESPOSTA' as SlaTipo,
				'TEMPO_ATENDIMENTO' as SlaTipo,
				'TEMPO_RESPOSTA' as SlaTipo,
			];

			// Buscar SLAs existentes no banco
			const slasExistentes = await this.prisma.sla.findMany({
				where: {
					tenant_id,
					is_deleted: false,
				},
				orderBy: { tipo: 'asc' },
			});

			// Criar mapa para facilitar busca
			const slasMap = new Map<string, Sla>();
			slasExistentes.forEach((sla) => {
				slasMap.set(sla.tipo, sla);
			});

			// Garantir que todos os 3 tipos estejam presentes (criar se não existirem)
			const slas: Sla[] = [];
			for (const tipo of tipos) {
				let sla = slasMap.get(tipo);
				if (!sla) {
					// Criar SLA se não existir
					sla = await this.prisma.sla.create({
						data: {
							tenant_id,
							tipo,
							tempo: 0,
							meta_conformidade: 85,
						},
					});
				}
				slas.push(sla);
			}

			return slas;
		} catch (error) {
			console.error('Erro ao buscar SLAs do tenant:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar SLAs do tenant');
		}
	}

	async findByTenantAndTipo(tenant_id: string, tipo: SlaTipo) {
		try {
			const sla = await this.prisma.sla.findFirst({
				where: {
					tenant_id,
					tipo,
					is_deleted: false,
				},
			});

			return sla;
		} catch (error) {
			console.error('Erro ao buscar SLA:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar SLA');
		}
	}

	async ensureDefaultSlas(tenant_id: string) {
		try {
			const tipos: SlaTipo[] = [
				'TEMPO_PRIMEIRA_RESPOSTA' as SlaTipo,
				'TEMPO_ATENDIMENTO' as SlaTipo,
				'TEMPO_RESPOSTA' as SlaTipo,
			];
			const slas: Sla[] = [];

			for (const tipo of tipos) {
				let sla = await this.findByTenantAndTipo(tenant_id, tipo);

				if (!sla) {
					sla = await this.create({
						tenant_id,
						tipo,
						tempo: 0,
						meta_conformidade: 85,
					});
				}

				slas.push(sla);
			}

			return slas;
		} catch (error) {
			console.error('Erro ao garantir SLAs padrão:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao garantir SLAs padrão');
		}
	}

	async delete(id: string) {
		try {
			await this.prisma.sla.update({
				where: { id },
				data: { is_deleted: true },
			});
			return id;
		} catch (error) {
			console.error('Erro ao deletar SLA:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao deletar SLA');
		}
	}
}

