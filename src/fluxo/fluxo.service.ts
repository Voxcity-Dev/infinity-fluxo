import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';

@Injectable()
export class FluxoService {
	constructor(
		private readonly prisma: PrismaService,
	) {}

	// Exemplo de método comentado
	/*
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
	*/
}