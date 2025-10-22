import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateNpsInput } from './dto/create-nps.dto';
import { ListNpsInput } from './dto/list-nps.dto';
import { UpdateNpsInput } from './dto/update-nps.dto';
import { CreateNpsSetorInput } from './dto/create-nps-setor.dto';
import { ListNpsSetorInput } from './dto/list-nps-setor.dto';
import { DeleteNpsSetorInput } from './dto/delete-nps-setor.dto';

@Injectable()
export class NpsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateNpsInput) {
		try {
			const nps = await this.prisma.nps.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
					pesquisa: data.pesquisa,
				},
			});
			return nps;
		} catch (error) {
			console.error('Erro ao criar NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao criar NPS');
		}
	}

	async update(data: UpdateNpsInput) {
		try {
			const { id, nome, pesquisa } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};
			
			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}
			
			if (pesquisa !== undefined && pesquisa !== null && pesquisa !== '') {
				updateData.pesquisa = pesquisa;
			}

			// Verificar se há pelo menos um campo para atualizar
			if (Object.keys(updateData).length === 0) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			const nps = await this.prisma.nps.update({
				where: { 
					id,
					is_deleted: false // Garantir que não atualize NPS deletados
				},
				data: updateData,
			});

			return nps;
		} catch (error) {
			console.error('Erro ao atualizar NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao atualizar NPS');
		}
	}

	async findAll(params: ListNpsInput) {
		try {
			const { page, limit, search, tenant_id } = params;

			// Construir objeto de query base
			const queryOptions: any = {
				where: { 
					tenant_id: tenant_id, 
					is_deleted: false,
					...(search && {
						OR: [
							{ nome: { contains: search, mode: 'insensitive' } },
							{ pesquisa: { contains: search, mode: 'insensitive' } },
						]
					})
				},
				orderBy: { created_at: 'desc' },
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const [nps, total] = await Promise.all([
				this.prisma.nps.findMany(queryOptions),
				this.prisma.nps.count({ where: queryOptions.where })
			]);

			// Buscar contagem de setores para cada NPS
			const npsWithSetoresCount = await Promise.all(
				nps.map(async (npsItem) => {
					const setoresCount = await this.prisma.npsSetor.count({
						where: {
							nps_id: npsItem.id,
							is_deleted: false
						}
					});

					return {
						...npsItem,
						setores_count: setoresCount
					};
				})
			);

			const totalPages = Math.ceil(total / limit);

			return {
				data: npsWithSetoresCount,
				meta: {
					page,
					limit,
					total,
					totalPages,
				}
			};
		} catch (error) {
			console.error('Erro ao listar NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar NPS');
		}
	}

	async findById(id: string) {
		try {
			const nps = await this.prisma.nps.findUnique({
				where: { 
					id,
					is_deleted: false // Garantir que não retorne NPS deletados
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado');
			}

			return nps;
		} catch (error) {
			console.error('Erro ao buscar NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar NPS');
		}
	}

	async delete(id: string) {
		try {
			await this.prisma.nps.update({
				where: { id: id },
				data: { is_deleted: true },
			});
			return id;
		} catch (error) {
			console.error('Erro ao deletar NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao deletar NPS');
		}
	}

	// Métodos para NpsSetor
	async createSetor(data: CreateNpsSetorInput) {
		try {
			// Verificar se o NPS existe
			const nps = await this.prisma.nps.findUnique({
				where: { 
					id: data.nps_id,
					is_deleted: false
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado');
			}

			// Verificar se já existe vínculo ativo
			const existingSetor = await this.prisma.npsSetor.findFirst({
				where: {
					nps_id: data.nps_id,
					setor_id: data.setor_id,
					is_deleted: false,
				},
			});

			if (existingSetor) {
				throw new BadRequestException('Setor já está vinculado a este NPS');
			}

			const npsSetor = await this.prisma.npsSetor.create({
				data: {
					tenant_id: data.tenant_id,
					nps_id: data.nps_id,
					setor_id: data.setor_id,
				},
			});

			return npsSetor;
		} catch (error) {
			console.error('Erro ao vincular setor ao NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao vincular setor ao NPS');
		}
	}

	async findSetoresByNpsId(params: ListNpsSetorInput) {
		try {
			const { nps_id, page, limit } = params;

			// Verificar se o NPS existe
			const nps = await this.prisma.nps.findUnique({
				where: { 
					id: nps_id,
					is_deleted: false
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado');
			}

			// Construir objeto de query base
			const queryOptions: any = {
				where: { 
					nps_id: nps_id,
					is_deleted: false
				},
				orderBy: { created_at: 'desc' },
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const [setores, total] = await Promise.all([
				this.prisma.npsSetor.findMany(queryOptions),
				this.prisma.npsSetor.count({ where: queryOptions.where })
			]);

			const totalPages = Math.ceil(total / limit);

			return {
				data: setores,
				meta: {
					page,
					limit,
					total,
					totalPages,
				}
			};
		} catch (error) {
			console.error('Erro ao listar setores do NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar setores do NPS');
		}
	}

	async deleteSetor(data: DeleteNpsSetorInput) {
		try {
			await this.prisma.npsSetor.update({
				where: { id: data.id },
				data: { is_deleted: true },
			});
			return data.id;
		} catch (error) {
			console.error('Erro ao remover vínculo de setor:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao remover vínculo de setor');
		}
	}
}