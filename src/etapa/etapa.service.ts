import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateEtapaInput } from './dto/create-etapa.dto';
import { ListEtapasInput } from './dto/list-etapa.dto';

@Injectable()
export class EtapaService {
	constructor(private readonly prisma: PrismaService) {}

	// Exemplo de método comentado
	/*
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
	*/
	async findAll(params: ListEtapasInput) {
		try {
			const { page, limit, search, tenant_id, fluxo_id, interacoes_id, tipo } = params;

			// Construir o filtro where apenas com campos válidos da tabela
			const where: any = {
				tenant_id,
				is_deleted: false, // Sempre filtrar registros não deletados
			};

			// Adicionar filtros opcionais apenas se fornecidos
			if (fluxo_id) where.fluxo_id = fluxo_id;
			if (interacoes_id) where.interacoes_id = interacoes_id;
			if (tipo) where.tipo = tipo;

			// Adicionar busca por texto no campo nome se search for fornecido
			if (search) {
				where.nome = {
					contains: search,
					mode: 'insensitive', // Busca case-insensitive
				};
			}

			const etapas = await this.prisma.etapas.findMany({
				where,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			// Contar total de registros para paginação
			const total = await this.prisma.etapas.count({ where });

			return {
				data: etapas,
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error('Erro ao listar etapas:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao listar etapas');
		}
	}

	async findById(id: string) {
		try {
			const etapa = await this.prisma.etapas.findUnique({ 
				where: { 
					id,
					is_deleted: false // Garantir que não retorne etapas deletadas
				} 
			});

			if (!etapa) {
				throw new NotFoundException('Etapa não encontrada');
			}

			return etapa;

		} catch (error) {
			console.error('Erro ao buscar etapa:', error);

			if (error instanceof HttpException) {
				throw error;
			}
			
			throw new BadRequestException('Erro ao buscar etapa');
		}
	}
}