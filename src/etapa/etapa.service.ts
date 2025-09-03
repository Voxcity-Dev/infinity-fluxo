import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateEtapaInput } from './dto/create-etapa.dto';

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
}