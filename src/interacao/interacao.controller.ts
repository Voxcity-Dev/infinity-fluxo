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
import { InteracaoService } from './interacao.service';
import { CreateInteracaoDto, CreateInteracaoResponseDto } from './dto/create-interacao.dto';
import {
	UpdateInteracaoDto,
	UpdateInteracaoResponseDto,
	InteracaoParamsDto,
} from './dto/update-interacao.dto';
import {
	ListInteracoesDto,
	ListInteracoesResponseDto,
	ListInteracoesSchema,
} from './dto/list-interacao.dto';
import { CreateInteracaoSchema, UpdateInteracaoSchema } from 'src/schemas/interacao.schema';
import { z } from 'zod';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.type';

// Schema para parâmetros
const InteracaoParamsSchema = z.object({
	id: z.uuid(),
});

@ApiTags('Interação')
@ApiBearerAuth('access-token')
@Controller('interacao')
export class InteracaoController {
	constructor(private readonly interacaoService: InteracaoService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar uma nova interação' })
	@ApiOkResponse({
		description: 'Interação criada com sucesso',
		type: CreateInteracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async create(
		@Body(new ZodPipe(CreateInteracaoSchema)) data: CreateInteracaoDto,
		@CurrentUser() user: User,
	) {
		const interacao = await this.interacaoService.create({
			...data,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Interação criada com sucesso!',
			data: interacao,
		};
	}

	@Get()
	@ApiOperation({ summary: 'Listar interações' })
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
		description: 'Busca por conteúdo',
	})
	@ApiQuery({
		name: 'tipo',
		required: false,
		type: String,
		description: 'Filtrar por tipo de interação',
	})
	@ApiOkResponse({
		description: 'Lista de interações',
		type: ListInteracoesResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAll(
		@Query(new ZodPipe(ListInteracoesSchema)) params: ListInteracoesDto,
		@CurrentUser() user: User,
	) {
		const result = await this.interacaoService.findAll({
			...params,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Interações listadas com sucesso!',
			data: result.data,
			meta: result.meta,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar interação por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da interação',
	})
	@ApiOkResponse({
		description: 'Interação encontrada',
		type: CreateInteracaoResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Interação não encontrada' })
	async findOne(
		@Param(new ZodPipe(InteracaoParamsSchema)) params: InteracaoParamsDto,
		@CurrentUser() user: User,
	) {
		const interacao = await this.interacaoService.findOne(params.id, user.tenant_id.toString());

		return {
			message: 'Interação encontrada com sucesso!',
			data: interacao,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Atualizar interação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da interação',
	})
	@ApiOkResponse({
		description: 'Interação atualizada com sucesso',
		type: UpdateInteracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Interação não encontrada' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async update(
		@Param(new ZodPipe(InteracaoParamsSchema)) params: InteracaoParamsDto,
		@Body(new ZodPipe(UpdateInteracaoSchema)) data: UpdateInteracaoDto,
		@CurrentUser() user: User,
	) {
		const interacao = await this.interacaoService.update(
			params.id,
			user.tenant_id.toString(),
			data,
		);

		return {
			message: 'Interação atualizada com sucesso!',
			data: interacao,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Remover interação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da interação',
	})
	@ApiOkResponse({
		description: 'Interação removida com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Interação não encontrada' })
	async remove(
		@Param(new ZodPipe(InteracaoParamsSchema)) params: InteracaoParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.interacaoService.remove(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}
}
