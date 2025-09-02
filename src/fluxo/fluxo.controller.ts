import { Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpCode } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { FluxoService } from './fluxo.service';
import { CreateFluxoDto, CreateFluxoResponseDto } from './dto/create-fluxo.dto';
import { UpdateFluxoDto, UpdateFluxoResponseDto, FluxoParamsDto } from './dto/update-fluxo.dto';
import { ListFluxosDto, ListFluxosResponseDto } from './dto/list-fluxo.dto';
import {
	CreateFluxoConfiguracaoDto,
	CreateFluxoConfiguracaoResponseDto,
} from './dto/create-fluxo-configuracao.dto';
import {
	UpdateFluxoConfiguracaoDto,
	UpdateFluxoConfiguracaoResponseDto,
	FluxoConfiguracaoParamsDto,
} from './dto/update-fluxo-configuracao.dto';
import { ListFluxoConfiguracoesResponseDto } from './dto/list-fluxo-configuracao.dto';
import {
	CreateFluxoSchema,
	UpdateFluxoSchema,
	CreateFlowConfiguracaoSchema,
	UpdateFlowConfiguracaoSchema,
} from 'src/schemas/fluxo.schema';
import { ListFluxosSchema } from './dto/list-fluxo.dto';
import { z } from 'zod';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.type';

// Schemas para parâmetros
const FluxoParamsSchema = z.object({
	id: z.uuid(),
});

const FluxoConfiguracaoParamsSchema = z.object({
	id: z.uuid(),
});

@ApiTags('Fluxo')
@ApiBearerAuth('access-token')
@Controller('fluxo')
export class FluxoController {
	constructor(private readonly fluxoService: FluxoService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar um novo fluxo' })
	@ApiOkResponse({
		description: 'Fluxo criado com sucesso',
		type: CreateFluxoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async create(
		@Body(new ZodPipe(CreateFluxoSchema)) data: CreateFluxoDto,
		@CurrentUser() user: User,
	) {
		const fluxo = await this.fluxoService.create({
			...data,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Fluxo criado com sucesso!',
			data: fluxo,
		};
	}

	@Get()
	@ApiOperation({ summary: 'Listar fluxos' })
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Página (padrão: 1)',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Limite por página (padrão: 10)',
	})
	@ApiQuery({
		name: 'search',
		required: false,
		type: String,
		description: 'Busca por nome',
	})
	@ApiOkResponse({
		description: 'Lista de fluxos',
		type: ListFluxosResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAll(
		@Query(new ZodPipe(ListFluxosSchema)) params: ListFluxosDto,
		@CurrentUser() user: User,
	) {
		const result = await this.fluxoService.findAll({
			...params,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Fluxos listados com sucesso!',
			data: result.data,
			meta: result.meta,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar fluxo por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID do fluxo',
	})
	@ApiOkResponse({
		description: 'Fluxo encontrado',
		type: CreateFluxoResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Fluxo não encontrado' })
	async findOne(
		@Param(new ZodPipe(FluxoParamsSchema)) params: FluxoParamsDto,
		@CurrentUser() user: User,
	) {
		const fluxo = await this.fluxoService.findOne(params.id, user.tenant_id.toString());

		return {
			message: 'Fluxo encontrado com sucesso!',
			data: fluxo,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Atualizar fluxo' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID do fluxo',
	})
	@ApiOkResponse({
		description: 'Fluxo atualizado com sucesso',
		type: UpdateFluxoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Fluxo não encontrado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async update(
		@Param(new ZodPipe(FluxoParamsSchema)) params: FluxoParamsDto,
		@Body(new ZodPipe(UpdateFluxoSchema)) data: UpdateFluxoDto,
		@CurrentUser() user: User,
	) {
		const fluxo = await this.fluxoService.update(params.id, user.tenant_id.toString(), data);

		return {
			message: 'Fluxo atualizado com sucesso!',
			data: fluxo,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Remover fluxo' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID do fluxo',
	})
	@ApiOkResponse({
		description: 'Fluxo removido com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Fluxo não encontrado' })
	async remove(
		@Param(new ZodPipe(FluxoParamsSchema)) params: FluxoParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.fluxoService.remove(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}

	// Endpoints para configurações do fluxo
	@Post(':id/configuracoes')
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar configuração para um fluxo' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID do fluxo',
	})
	@ApiOkResponse({
		description: 'Configuração criada com sucesso',
		type: CreateFluxoConfiguracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar configuração' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async createConfiguracao(
		@Param(new ZodPipe(FluxoParamsSchema)) params: FluxoParamsDto,
		@Body(new ZodPipe(CreateFlowConfiguracaoSchema))
		data: CreateFluxoConfiguracaoDto,
		@CurrentUser() user: User,
	) {
		const configuracao = await this.fluxoService.createConfiguracao({
			...data,
			tenant_id: user.tenant_id.toString(),
			fluxo_id: params.id,
		});

		return {
			message: 'Configuração criada com sucesso!',
			data: configuracao,
		};
	}

	@Get(':id/configuracoes')
	@ApiOperation({ summary: 'Listar configurações de um fluxo' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID do fluxo',
	})
	@ApiOkResponse({
		description: 'Lista de configurações',
		type: ListFluxoConfiguracoesResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAllConfiguracoes(
		@Param(new ZodPipe(FluxoParamsSchema)) params: FluxoParamsDto,
		@CurrentUser() user: User,
	) {
		const configuracoes = await this.fluxoService.findAllConfiguracoes(
			params.id,
			user.tenant_id.toString(),
		);

		return {
			message: 'Configurações listadas com sucesso!',
			data: configuracoes,
		};
	}

	@Get('configuracoes/:id')
	@ApiOperation({ summary: 'Buscar configuração por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da configuração',
	})
	@ApiOkResponse({
		description: 'Configuração encontrada',
		type: CreateFluxoConfiguracaoResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Configuração não encontrada' })
	async findOneConfiguracao(
		@Param(new ZodPipe(FluxoConfiguracaoParamsSchema))
		params: FluxoConfiguracaoParamsDto,
		@CurrentUser() user: User,
	) {
		const configuracao = await this.fluxoService.findOneConfiguracao(
			params.id,
			user.tenant_id.toString(),
		);

		return {
			message: 'Configuração encontrada com sucesso!',
			data: configuracao,
		};
	}

	@Patch('configuracoes/:id')
	@ApiOperation({ summary: 'Atualizar configuração' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da configuração',
	})
	@ApiOkResponse({
		description: 'Configuração atualizada com sucesso',
		type: UpdateFluxoConfiguracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar configuração' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Configuração não encontrada' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async updateConfiguracao(
		@Param(new ZodPipe(FluxoConfiguracaoParamsSchema))
		params: FluxoConfiguracaoParamsDto,
		@Body(new ZodPipe(UpdateFlowConfiguracaoSchema))
		data: UpdateFluxoConfiguracaoDto,
		@CurrentUser() user: User,
	) {
		const configuracao = await this.fluxoService.updateConfiguracao(
			params.id,
			user.tenant_id.toString(),
			data,
		);

		return {
			message: 'Configuração atualizada com sucesso!',
			data: configuracao,
		};
	}

	@Delete('configuracoes/:id')
	@ApiOperation({ summary: 'Remover configuração' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da configuração',
	})
	@ApiOkResponse({
		description: 'Configuração removida com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover configuração' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Configuração não encontrada' })
	async removeConfiguracao(
		@Param(new ZodPipe(FluxoConfiguracaoParamsSchema))
		params: FluxoConfiguracaoParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.fluxoService.removeConfiguracao(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}
}
