import {
	Body,
	Controller,
	Post,
	HttpCode,
	Param,
	Put,
	Delete,
	Req,
	BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { InteracaoService } from './interacao.service';
import { CreateInteracaoDto, CreateInteracaoResponseDto } from './dto/create-interacao.dto';
import { CreateInteracaoSchema } from 'src/schemas/interacao.schema';
import {
	ListInteracoesInput,
	ListInteracoesResponseDto,
	ListInteracoesSchema,
} from './dto/list-interacao.dto';
import { UpdateInteracaoDto, UpdateInteracaoResponseDto } from './dto/update-interacao.dto';
import { UpdateInteracaoSchema } from 'src/schemas/interacao.schema';

@ApiTags('Interação')
@Controller('interacao')
export class InteracaoController {
	constructor(private readonly interacaoService: InteracaoService) {}

	// Exemplo de rota comentada
	/*
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
	) {
		const interacao = await this.interacaoService.create(data);

		return {
			message: 'Interação criada com sucesso!',
			data: interacao,
		};
	}
	*/

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todas as interações' })
	@ApiOkResponse({
		description: 'Interações listadas com sucesso',
		type: ListInteracoesResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao listar interações' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(
		@Body(new ZodPipe(ListInteracoesSchema)) params: ListInteracoesInput,
		@Req() request: Request,
	) {
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const interacoes = await this.interacaoService.findAll({
			...params,
			tenant_id,
		} as ListInteracoesInput);
		return { message: 'Interações listadas com sucesso!', data: interacoes };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova interação' })
	@ApiOkResponse({ description: 'Interação criada com sucesso', type: CreateInteracaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async criar(
		@Body(new ZodPipe(CreateInteracaoSchema)) data: CreateInteracaoDto,
		@Req() request: Request,
	) {
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const interacao = await this.interacaoService.create({ ...data, tenant_id } as any);
		return { message: 'Interação criada com sucesso!', data: interacao };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar uma interação' })
	@ApiOkResponse({
		description: 'Interação atualizada com sucesso',
		type: UpdateInteracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao atualizar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(@Body(new ZodPipe(UpdateInteracaoSchema)) data: UpdateInteracaoDto) {
		console.log(data);
		const interacao = await this.interacaoService.update(data);
		return { message: 'Interação atualizada com sucesso!', data: interacao };
	}

	@Delete(':id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar uma interação' })
	@ApiOkResponse({
		description: 'Interação deletada com sucesso',
		type: UpdateInteracaoResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Erro ao deletar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('id') id: string) {
		const interacao = await this.interacaoService.delete(id);
		return { message: 'Interação deletada com sucesso!', data: interacao };
	}
}
