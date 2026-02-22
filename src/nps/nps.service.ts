import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateNpsInput } from './dto/create-nps.dto';
import { ListNpsInput } from './dto/list-nps.dto';
import { UpdateNpsInput } from './dto/update-nps.dto';
import { CreateNpsFilaInput } from './dto/create-nps-fila.dto';
import { ListNpsFilaInput } from './dto/list-nps-fila.dto';
import { DeleteNpsFilaInput } from './dto/delete-nps-fila.dto';
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
			const { id, nome, pesquisa, expiracao_habilitada, expiracao_horas, expiracao_mensagem, expiracao_silenciosa } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};

			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}

			if (pesquisa !== undefined && pesquisa !== null && pesquisa !== '') {
				updateData.pesquisa = pesquisa;
			}

			// Campos de expiração
			if (expiracao_habilitada !== undefined) {
				updateData.expiracao_habilitada = expiracao_habilitada;
			}
			if (expiracao_horas !== undefined) {
				updateData.expiracao_horas = expiracao_horas;
			}
			if (expiracao_mensagem !== undefined) {
				updateData.expiracao_mensagem = expiracao_mensagem;
			}
			if (expiracao_silenciosa !== undefined) {
				updateData.expiracao_silenciosa = expiracao_silenciosa;
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

			const totalPages = Math.ceil(total / limit);

			return {
				data: nps,
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
					resposta: 'Obrigado por responder a pesquisa!', nps_id: npsResposta.id
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

	// Métodos para NpsFila
	async createFila(data: CreateNpsFilaInput) {
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

			// Verificar se já existe vínculo para esta fila
			const existingFila = await this.prisma.npsFila.findFirst({
				where: {
					fila_atendimento_id: data.fila_atendimento_id,
				},
			});

			// Se existe vínculo, deletar primeiro (hard delete)
			if (existingFila) {
				await this.prisma.npsFila.delete({
					where: { id: existingFila.id },
				});
			}

			// Criar novo vínculo
			const npsFila = await this.prisma.npsFila.create({
				data: {
					tenant_id: data.tenant_id,
					nps_id: data.nps_id,
					fila_atendimento_id: data.fila_atendimento_id,
				},
			});

			return npsFila;
		} catch (error) {
			console.error('Erro ao vincular fila ao NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao vincular fila ao NPS');
		}
	}

	async findFilasByNpsId(params: ListNpsFilaInput) {
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
				},
				orderBy: { created_at: 'desc' },
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const [filas, total] = await Promise.all([
				this.prisma.npsFila.findMany(queryOptions),
				this.prisma.npsFila.count({ where: queryOptions.where })
			]);

			const totalPages = Math.ceil(total / limit);

			return {
				data: filas,
				meta: {
					page,
					limit,
					total,
					totalPages,
				}
			};
		} catch (error) {
			console.error('Erro ao listar filas do NPS:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao listar filas do NPS');
		}
	}

	async deleteFila(data: DeleteNpsFilaInput) {
		try {
			// Verificar se o registro existe
			const existingFila = await this.prisma.npsFila.findFirst({
				where: {
					fila_atendimento_id: data.id,
				},
			});

			if (!existingFila) {
				throw new NotFoundException('Vínculo de fila não encontrado');
			}

			// Hard delete
			await this.prisma.npsFila.deleteMany({
				where: { fila_atendimento_id: data.id },
			});
			return data.id;
		} catch (error) {
			console.error('Erro ao remover vínculo de fila:', error);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao remover vínculo de fila');
		}
	}

	async findByFilaId(fila_atendimento_id: string) {
		try {
			// Buscar o NPS vinculado à fila
			const npsFila = await this.prisma.npsFila.findFirst({
				where: {
					fila_atendimento_id: fila_atendimento_id,
				},
			});

			if (!npsFila) {
				throw new NotFoundException('NPS não encontrado para esta fila');
			}

			// Buscar o NPS
			const nps = await this.prisma.nps.findUnique({
				where: {
					id: npsFila.nps_id,
					is_deleted: false,
				},
				select: {
					id: true,
					nome: true,
					pesquisa: true,
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado para esta fila');
			}

			return nps;
		} catch (error) {

			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao buscar NPS por fila');
		}
	}

	/**
	 * Busca configuração de expiração NPS por fila de atendimento
	 * Usado pelo Cron para verificar tickets NPS expirados
	 */
	async findExpiracaoByFilaId(fila_atendimento_id: string) {
		try {
			// Buscar o NPS vinculado à fila
			const npsFila = await this.prisma.npsFila.findFirst({
				where: {
					fila_atendimento_id: fila_atendimento_id,
				},
			});

			if (!npsFila) {
				throw new NotFoundException('NPS não encontrado para esta fila');
			}

			// Buscar o NPS com config de expiração
			const nps = await this.prisma.nps.findUnique({
				where: {
					id: npsFila.nps_id,
					is_deleted: false,
				},
				select: {
					expiracao_habilitada: true,
					expiracao_horas: true,
					expiracao_mensagem: true,
					expiracao_silenciosa: true,
				},
			});

			if (!nps) {
				throw new NotFoundException('NPS não encontrado para esta fila');
			}

			// Retornar no formato esperado pelo Cron
			return {
				nps: {
					habilitada: nps.expiracao_habilitada,
					horas: nps.expiracao_horas,
					mensagem: nps.expiracao_mensagem || '',
					silencioso: nps.expiracao_silenciosa,
				},
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new BadRequestException('Erro ao buscar configuração de expiração NPS');
		}
	}

	/**
	 * Retorna mapa de ticketId → score NPS para os ticket IDs fornecidos.
	 * Usado pelo infinity-ia para enriquecer o pool de aprendizado.
	 */
	async getScoresByTicketIds(
		ticketIds: string[],
		tenantId?: string,
	): Promise<Record<string, number>> {
		const respostas = await this.prisma.npsResposta.findMany({
			where: {
				ticket_id: { in: ticketIds },
				...(tenantId
					? { nps: { tenant_id: tenantId, is_deleted: false } }
					: {}),
			},
			select: {
				ticket_id: true,
				resposta: true,
			},
		});

		const scores: Record<string, number> = {};
		for (const r of respostas) {
			if (r.ticket_id) {
				scores[r.ticket_id] = r.resposta;
			}
		}
		return scores;
	}
}