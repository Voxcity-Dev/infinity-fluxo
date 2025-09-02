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
import { EtapaService } from './etapa.service';
import { CreateEtapaDto, CreateEtapaResponseDto } from './dto/create-etapa.dto';
import { UpdateEtapaDto, UpdateEtapaResponseDto, EtapaParamsDto } from './dto/update-etapa.dto';
import { ListEtapasDto, ListEtapasResponseDto, ListEtapasSchema } from './dto/list-etapa.dto';
import { CreateEtapaSchema, UpdateEtapaSchema } from 'src/schemas/etapa.schema';
import { z } from 'zod';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.type';

// Schema para parâmetros
const EtapaParamsSchema = z.object({
	id: z.uuid(),
});

@ApiTags('Etapa')
@ApiBearerAuth('access-token')
@Controller('etapa')
export class EtapaController {
	constructor(private readonly etapaService: EtapaService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar uma nova etapa' })
	@ApiOkResponse({
		description: 'Etapa criada com sucesso',
		type: CreateEtapaResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async create(
		@Body(new ZodPipe(CreateEtapaSchema)) data: CreateEtapaDto,
		@CurrentUser() user: User,
	) {
		const etapa = await this.etapaService.create({
			...data,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Etapa criada com sucesso!',
			data: etapa,
		};
	}

	@Get()
	@ApiOperation({ summary: 'Listar etapas' })
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
	@ApiQuery({
		name: 'tipo',
		required: false,
		type: String,
		description: 'Filtrar por tipo de etapa',
	})
	@ApiQuery({
		name: 'fluxo_id',
		required: false,
		type: String,
		description: 'Filtrar por fluxo',
	})
	@ApiOkResponse({
		description: 'Lista de etapas',
		type: ListEtapasResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAll(
		@Query(new ZodPipe(ListEtapasSchema)) params: ListEtapasDto,
		@CurrentUser() user: User,
	) {
		const result = await this.etapaService.findAll({
			...params,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Etapas listadas com sucesso!',
			data: result.data,
			meta: result.meta,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar etapa por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da etapa',
	})
	@ApiOkResponse({
		description: 'Etapa encontrada',
		type: CreateEtapaResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Etapa não encontrada' })
	async findOne(
		@Param(new ZodPipe(EtapaParamsSchema)) params: EtapaParamsDto,
		@CurrentUser() user: User,
	) {
		const etapa = await this.etapaService.findOne(params.id, user.tenant_id.toString());

		return {
			message: 'Etapa encontrada com sucesso!',
			data: etapa,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Atualizar etapa' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da etapa',
	})
	@ApiOkResponse({
		description: 'Etapa atualizada com sucesso',
		type: UpdateEtapaResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Etapa não encontrada' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async update(
		@Param(new ZodPipe(EtapaParamsSchema)) params: EtapaParamsDto,
		@Body(new ZodPipe(UpdateEtapaSchema)) data: UpdateEtapaDto,
		@CurrentUser() user: User,
	) {
		const etapa = await this.etapaService.update(params.id, user.tenant_id.toString(), data);

		return {
			message: 'Etapa atualizada com sucesso!',
			data: etapa,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Remover etapa' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da etapa',
	})
	@ApiOkResponse({
		description: 'Etapa removida com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Etapa não encontrada' })
	async remove(
		@Param(new ZodPipe(EtapaParamsSchema)) params: EtapaParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.etapaService.remove(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}
}
