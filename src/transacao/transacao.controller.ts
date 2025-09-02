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
import { TransacaoService } from './transacao.service';
import { CreateTransacaoDto, CreateTransacaoResponseDto } from './dto/create-transacao.dto';
import {
	UpdateTransacaoDto,
	UpdateTransacaoResponseDto,
	TransacaoParamsDto,
} from './dto/update-transacao.dto';
import {
	ListTransacoesDto,
	ListTransacoesResponseDto,
	ListTransacoesSchema,
} from './dto/list-transacao.dto';
import {
	CreateTransacaoRegraDto,
	CreateTransacaoRegraResponseDto,
} from './dto/create-transacao-regra.dto';
import {
	UpdateTransacaoRegraDto,
	UpdateTransacaoRegraResponseDto,
	TransacaoRegraParamsDto,
} from './dto/update-transacao-regra.dto';
import { ListTransacaoRegrasResponseDto } from './dto/list-transacao-regra.dto';
import {
	CreateTransacaoSchema,
	UpdateTransacaoSchema,
	CreateTransacaoRegraSchema,
	UpdateTransacaoRegraSchema,
} from 'src/schemas/transacao.schema';
import { z } from 'zod';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.type';

// Schemas para parâmetros
const TransacaoParamsSchema = z.object({
	id: z.uuid(),
});

const TransacaoRegraParamsSchema = z.object({
	id: z.uuid(),
});

@ApiTags('Transação')
@ApiBearerAuth('access-token')
@Controller('transacao')
export class TransacaoController {
	constructor(private readonly transacaoService: TransacaoService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar uma nova transação' })
	@ApiOkResponse({
		description: 'Transação criada com sucesso',
		type: CreateTransacaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar transação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async create(
		@Body(new ZodPipe(CreateTransacaoSchema)) data: CreateTransacaoDto,
		@CurrentUser() user: User,
	) {
		const transacao = await this.transacaoService.create({
			...data,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Transação criada com sucesso!',
			data: transacao,
		};
	}

	@Get()
	@ApiOperation({ summary: 'Listar transações' })
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
		name: 'etapa_id',
		required: false,
		type: String,
		description: 'Filtrar por etapa',
	})
	@ApiOkResponse({
		description: 'Lista de transações',
		type: ListTransacoesResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAll(
		@Query(new ZodPipe(ListTransacoesSchema)) params: ListTransacoesDto,
		@CurrentUser() user: User,
	) {
		const result = await this.transacaoService.findAll({
			...params,
			tenant_id: user.tenant_id.toString(),
		});

		return {
			message: 'Transações listadas com sucesso!',
			data: result.data,
			meta: result.meta,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar transação por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da transação',
	})
	@ApiOkResponse({
		description: 'Transação encontrada',
		type: CreateTransacaoResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Transação não encontrada' })
	async findOne(
		@Param(new ZodPipe(TransacaoParamsSchema)) params: TransacaoParamsDto,
		@CurrentUser() user: User,
	) {
		const transacao = await this.transacaoService.findOne(params.id, user.tenant_id.toString());

		return {
			message: 'Transação encontrada com sucesso!',
			data: transacao,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Atualizar transação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da transação',
	})
	@ApiOkResponse({
		description: 'Transação atualizada com sucesso',
		type: UpdateTransacaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar transação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Transação não encontrada' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async update(
		@Param(new ZodPipe(TransacaoParamsSchema)) params: TransacaoParamsDto,
		@Body(new ZodPipe(UpdateTransacaoSchema)) data: UpdateTransacaoDto,
		@CurrentUser() user: User,
	) {
		const transacao = await this.transacaoService.update(
			params.id,
			user.tenant_id.toString(),
			data,
		);

		return {
			message: 'Transação atualizada com sucesso!',
			data: transacao,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Remover transação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da transação',
	})
	@ApiOkResponse({
		description: 'Transação removida com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover transação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Transação não encontrada' })
	async remove(
		@Param(new ZodPipe(TransacaoParamsSchema)) params: TransacaoParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.transacaoService.remove(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}

	// Endpoints para regras de transação
	@Post(':id/regras')
	@HttpCode(201)
	@ApiOperation({ summary: 'Criar regra para uma transação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da transação',
	})
	@ApiOkResponse({
		description: 'Regra criada com sucesso',
		type: CreateTransacaoRegraResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao criar regra' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async createRegra(
		@Param(new ZodPipe(TransacaoParamsSchema)) params: TransacaoParamsDto,
		@Body(new ZodPipe(CreateTransacaoRegraSchema))
		data: CreateTransacaoRegraDto,
		@CurrentUser() user: User,
	) {
		const regra = await this.transacaoService.createRegra({
			...data,
			tenant_id: user.tenant_id.toString(),
			transacao_id: params.id,
		});

		return {
			message: 'Regra criada com sucesso!',
			data: regra,
		};
	}

	@Get(':id/regras')
	@ApiOperation({ summary: 'Listar regras de uma transação' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da transação',
	})
	@ApiOkResponse({
		description: 'Lista de regras',
		type: ListTransacaoRegrasResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async findAllRegras(
		@Param(new ZodPipe(TransacaoParamsSchema)) params: TransacaoParamsDto,
		@CurrentUser() user: User,
	) {
		const regras = await this.transacaoService.findAllRegras(params.id, user.tenant_id.toString());

		return {
			message: 'Regras listadas com sucesso!',
			data: regras,
		};
	}

	@Get('regras/:id')
	@ApiOperation({ summary: 'Buscar regra por ID' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da regra',
	})
	@ApiOkResponse({
		description: 'Regra encontrada',
		type: CreateTransacaoRegraResponseDto,
	})
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Regra não encontrada' })
	async findOneRegra(
		@Param(new ZodPipe(TransacaoRegraParamsSchema))
		params: TransacaoRegraParamsDto,
		@CurrentUser() user: User,
	) {
		const regra = await this.transacaoService.findOneRegra(params.id, user.tenant_id.toString());

		return {
			message: 'Regra encontrada com sucesso!',
			data: regra,
		};
	}

	@Patch('regras/:id')
	@ApiOperation({ summary: 'Atualizar regra' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da regra',
	})
	@ApiOkResponse({
		description: 'Regra atualizada com sucesso',
		type: UpdateTransacaoRegraResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar regra' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Regra não encontrada' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async updateRegra(
		@Param(new ZodPipe(TransacaoRegraParamsSchema))
		params: TransacaoRegraParamsDto,
		@Body(new ZodPipe(UpdateTransacaoRegraSchema))
		data: UpdateTransacaoRegraDto,
		@CurrentUser() user: User,
	) {
		const regra = await this.transacaoService.updateRegra(
			params.id,
			user.tenant_id.toString(),
			data,
		);

		return {
			message: 'Regra atualizada com sucesso!',
			data: regra,
		};
	}

	@Delete('regras/:id')
	@ApiOperation({ summary: 'Remover regra' })
	@ApiParam({
		name: 'id',
		type: String,
		description: 'ID da regra',
	})
	@ApiOkResponse({
		description: 'Regra removida com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Erro ao remover regra' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Regra não encontrada' })
	async removeRegra(
		@Param(new ZodPipe(TransacaoRegraParamsSchema))
		params: TransacaoRegraParamsDto,
		@CurrentUser() user: User,
	) {
		const result = await this.transacaoService.removeRegra(params.id, user.tenant_id.toString());

		return {
			message: result.message,
		};
	}
}
