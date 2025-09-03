import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { CreateFluxoInput } from './dto/create-fluxo.dto';
import { ListFluxosInput } from './dto/list-fluxo.dto';
import { FluxoConfiguracaoChave } from '@prisma/client';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';

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

	async findAll(params: ListFluxosInput) {
		try {
			const { page, limit, search, tenant_id } = params;

			const fluxos = await this.prisma.fluxo.findMany({
				where: {
					tenant_id,
					nome: {
						contains: search,
					},
					is_deleted: false,
				},
				skip: (page - 1) * limit,
				take: limit,
				orderBy: {
					created_at: 'desc',
				},
			});

			return fluxos;
		} catch (error) {
			console.error('Erro ao listar fluxos:', error);
			throw new BadRequestException('Erro ao listar fluxos');
		}
	}

	async findById(fluxo_id: string) {
		try {
			const fluxo = await this.prisma.fluxo.findUnique({
				where: { id: fluxo_id, },
			});
			return fluxo;
		} catch (error) {
			console.error('Erro ao obter fluxo:', error);
			throw new BadRequestException('Erro ao obter fluxo');
		}
	}

	async create(data: CreateFluxoInput) {
		try {
			const fluxo = await this.prisma.fluxo.create({
				data: {
					tenant_id: data.tenant_id,
					nome: data.nome,
				},
			});

			// Criar configurações padrão após criar o fluxo
			await this.configuracaoDefault(data.tenant_id, fluxo.id);

			return fluxo;
		} catch (error) {
			console.error('Erro ao criar fluxo:', error);
			throw new BadRequestException('Erro ao criar fluxo');
		}
	}

	async delete(fluxo_id: string) {
		try {
			await this.prisma.fluxo.update({
				where: { id: fluxo_id, },
				data: { is_deleted: true, },
			});
		} catch (error) {
			console.error('Erro ao deletar fluxo:', error);
			throw new BadRequestException('Erro ao deletar fluxo');
		}
	}

	async updateConfiguracao(data: UpdateFluxoConfiguracaoInput) {
		try {
			const { configuracoes } = data 
			
			// Usar transação para garantir consistência
			const resultados = await this.prisma.$transaction(
				configuracoes.map((config) =>
					this.prisma.fluxoConfiguracao.update({
						where: { id: config.id, },
						data: { valor: config.valor },
					})
				)
			);
			
			return resultados;
		} catch (error) {
			console.error('Erro ao atualizar configurações:', error);
			throw new BadRequestException('Erro ao atualizar configurações');
		}
	}

	private readonly configuracaoDefaults = {
		SEND_MESSAGE: 'Seu atendimento foi encaminhado para a fila! Aguarde a resposta do atendente.',
		INVALID_RESPONSE_MESSAGE: 'Desculpe, não entendi sua resposta. Poderia repetir?',
		TIMEOUT_MINUTES: 'NONE',
		QUEUE_DEFAULT: '',
		USER_DEFAULT: '',
		MAX_RETRIES: '3',
		AUTO_ASSIGNMENT: 'NONE', // NONE, RANDOM, BALANCED
		END_FLOW_ON_CONDITION: 'encerrar'
	} as const;

	private async configuracaoDefault(tenant_id: string, fluxo_id: string) {
		try {
			// Criar todas as configurações de uma vez
			const configuracoes = Object.entries(this.configuracaoDefaults).map(([chave, valor]) => ({
				tenant_id,
				fluxo_id,
				chave: chave as FluxoConfiguracaoChave,
				valor
			}));

			await this.prisma.fluxoConfiguracao.createMany({
				data: configuracoes,
				skipDuplicates: true // Evita erros se já existir
			});

			console.log(`Configurações padrão criadas para fluxo ${fluxo_id}`);
		} catch (error) {
			console.error('Erro ao criar configuração default:', error);
			throw new BadRequestException('Erro ao criar configuração default');
		}
	}
}