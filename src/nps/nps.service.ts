import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateNpsInput } from './dto/create-nps.dto';
import { ListNpsInput } from './dto/list-nps.dto';
import { UpdateNpsInput } from './dto/update-nps.dto';
import { CreateNpsSetorInput } from './dto/create-nps-setor.dto';
import { ListNpsSetorInput } from './dto/list-nps-setor.dto';
import { DeleteNpsSetorInput } from './dto/delete-nps-setor.dto';
import { RespostaNpsInput } from './dto/resposta-nps.dto';

@Injectable()
export class NpsService {
	constructor(private readonly prisma: PrismaService) {}

	async execute(data: any) {
		try {
			const nps = await this.create(data);
			return nps;
		} catch (error) {
			console.error('Erro ao executar NPS:', error);
			throw new BadRequestException('Erro ao executar NPS');
		}
	}

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

			// Verificar se já existe vínculo ativo para este setor
			const existingSetor = await this.prisma.npsSetor.findFirst({
				where: {
					setor_id: data.setor_id,
					is_deleted: false,
				},
			});

			// Se existe vínculo ativo, desvincular primeiro
			if (existingSetor) {
				await this.prisma.npsSetor.update({
					where: { id: existingSetor.id },
					data: { is_deleted: true },
				});
			}

			// Criar novo vínculo
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

	async findBySetorId(setor_id: string) {
		try {
			// Buscar o NPS vinculado ao setor
			const npsSetor = await this.prisma.npsSetor.findFirst({
				where: {
					setor_id: setor_id,
					is_deleted: false,
				},
			});

			if (!npsSetor) {
				throw new NotFoundException('NPS não encontrado para este setor');
			}

			// Buscar o NPS
			const nps = await this.prisma.nps.findUnique({
				where: {
					id: npsSetor.nps_id,
					is_deleted: false,
				},
				select: {
					id: true,
					nome: true,
					pesquisa: true,
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado para este setor');
			}

			return nps;
		} catch (error) {
			console.error('Erro ao buscar NPS por setor:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar NPS por setor');
		}
	}

	async responder(data: RespostaNpsInput) {
		try {
			// Verificar se o NPS existe
			const nps = await this.prisma.nps.findUnique({
				where: {
					id: data.nps_id,
					is_deleted: false,
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado');
			}

			// Criar a resposta do NPS
			const npsResposta = await this.prisma.npsResposta.create({
				data: {
					nps_id: data.nps_id,
					resposta: data.nota,
					...(data.ticket_id && { ticket_id: data.ticket_id }),
				},
			});

			if (npsResposta) {
				return {
					data: {resposta: 'Obrigado por responder a pesquisa!'},
				};
			} else {
				throw new BadRequestException('Erro ao responder NPS');
			}

		} catch (error) {
			console.error('Erro ao responder NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao responder NPS');
		}
	}
}