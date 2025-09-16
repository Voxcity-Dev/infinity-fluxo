import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateInteracaoInput } from './dto/create-interacao.dto';
import { ListInteracoesInput } from './dto/list-interacao.dto';
import { UpdateInteracaoInput } from './dto/update-interacao.dto';

@Injectable()
export class InteracaoService {
	constructor(private readonly prisma: PrismaService) {}

	// Exemplo de método comentado
	/*
	async create(data: CreateInteracaoInput) {
		try {
			const interacao = await this.prisma.interacoes.create({
				data: {
					tenant_id: data.tenant_id,
					tipo: data.tipo,
					conteudo: data.conteudo,
					url_midia: data.url_midia,
					metadados: data.metadados,
				},
			});

			return interacao;
		} catch (error) {
			console.error('Erro ao criar interação:', error);
			throw new BadRequestException('Erro ao criar interação');
		}
	}
	*/

	async findAll(params: ListInteracoesInput) {
		try {
			const { page, limit, search, tenant_id, tipo } = params;

			// Construir objeto de query base
			const queryOptions: any = {
				where: { tenant_id: tenant_id, is_deleted: false },
				orderBy: { created_at: 'asc' },
			};

			// Adicionar paginação apenas se page e limit estiverem presentes
			if (page && limit) {
				queryOptions.skip = (page - 1) * limit;
				queryOptions.take = limit;
			}

			const interacoes = await this.prisma.interacoes.findMany(queryOptions);

			return interacoes;
		} catch (error) {
			console.error('Erro ao listar interações:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar interações');
		}
	}

	async findById(id: string) {
		try {
			const interacao = await this.prisma.interacoes.findUnique({
				where: { 
					id,
					is_deleted: false // Garantir que não retorne interações deletadas
				},
			});

			if (!interacao) {
				throw new NotFoundException('Interação não encontrada');
			}

			return interacao;
		} catch (error) {
			console.error('Erro ao buscar interação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar interação');
		}
	}

	async create(data: CreateInteracaoInput) {
		try {
			const interacao = await this.prisma.interacoes.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
					tipo: data.tipo,
					conteudo: data.conteudo,
					url_midia: data.url_midia,
					metadados: data.metadados,
				},
			});
			return interacao;
		} catch (error) {
			console.error('Erro ao criar interação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao criar interação');
		}
	}

	async update(data: UpdateInteracaoInput) {
		try {
			const { id, nome, tipo, conteudo, url_midia, metadados } = data;

			// Construir objeto de dados apenas com campos não vazios
			const updateData: any = {};
			
			if (nome !== undefined && nome !== null && nome !== '') {
				updateData.nome = nome;
			}
			
			if (tipo !== undefined && tipo !== null) {
				updateData.tipo = tipo;
			}
			
			if (conteudo !== undefined && conteudo !== null && conteudo !== '') {
				updateData.conteudo = conteudo;
			}
			
			if (url_midia !== undefined) {
				updateData.url_midia = url_midia || null;
			}
			
			if (metadados !== undefined) {
				updateData.metadados = metadados;
			}

			// Verificar se há pelo menos um campo para atualizar
			if (Object.keys(updateData).length === 0) {
				throw new BadRequestException('Nenhum campo válido fornecido para atualização');
			}

			const interacao = await this.prisma.interacoes.update({
				where: { 
					id,
					is_deleted: false // Garantir que não atualize interações deletadas
				},
				data: updateData,
			});

			return interacao;
		} catch (error) {
			console.error('Erro ao atualizar interação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao atualizar interação');
		}
	}

	async delete(id: string) {
		try {
			await this.prisma.interacoes.update({
				where: { id: id },
				data: { is_deleted: true },
			});
			return id;
		} catch (error) {
			console.error('Erro ao deletar interação:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao deletar interação');
		}
	}
}