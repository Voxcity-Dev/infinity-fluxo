import { BadRequestException, Injectable } from '@nestjs/common';
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
			const { page, limit, search, tenant_id, fluxo_id, tipo } = params;

			const etapas = await this.prisma.etapas.findMany({
				where: params,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			return etapas;
		} catch (error) {
			console.error('Erro ao listar etapas:', error);
			throw new BadRequestException('Erro ao listar etapas');
		}
	}
}