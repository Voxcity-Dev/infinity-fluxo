import { Body, Controller, Post, HttpCode, Put, Delete, Param, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import {
	ApiHeader,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { CondicaoService } from './condicao.service';
import { CreateCondicaoDto, CreateCondicaoResponseDto } from './dto/create-condicao.dto';
import { ListCondicoesInput, ListCondicoesResponseDto, ListCondicoesSchema } from './dto/list-condicao.dto';
import { UpdateCondicaoRegraDto } from './dto/update-condicao-regra.dto';
import { CreateCondicaoSchema, UpdateCondicaoRegraSchema } from 'src/schemas/condicao.schema';
import { ZodPipe } from 'src/common/pipes/zod.pipe';

@ApiTags('Condição')
@ApiHeader({
	name: 'x-microservice-token',
	description: 'Token do microserviço',
	required: true,
})
@Controller('condicao')
export class CondicaoController {
	constructor(private readonly condicaoService: CondicaoService) {}
	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar as condições de uma etapa' })
	@ApiOkResponse({ description: 'Condições listadas com sucesso', type: ListCondicoesResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar condições' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(
		@Body(new ZodPipe(ListCondicoesSchema)) params: ListCondicoesInput,
		@Req() request: Request,
	) {
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const condicoes = await this.condicaoService.find({ ...params, tenant_id } as ListCondicoesInput);
		return { message: 'Condições listadas com sucesso!', data: condicoes };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova condição' })
	@ApiOkResponse({ description: 'Condição criada com sucesso', type: CreateCondicaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar condição' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async criar(
		@Body(new ZodPipe(CreateCondicaoSchema)) data: CreateCondicaoDto,
		@Req() request: Request,
	) {
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const condicao = await this.condicaoService.create({ ...data, tenant_id } as any);
		return { message: 'Condição criada com sucesso!', data: condicao };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar as regras de uma condição' })
	@ApiOkResponse({ description: 'Regras atualizadas com sucesso', type: CreateCondicaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar regras' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(@Body(new ZodPipe(UpdateCondicaoRegraSchema)) data: UpdateCondicaoRegraDto) {
		const condicao = await this.condicaoService.updateRegras(data);
		return { message: 'Regras atualizadas com sucesso!', data: condicao };
	}

	@Delete('regra/:regra_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar uma condição' })
	@ApiOkResponse({ description: 'Condição deletada com sucesso', type: CreateCondicaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao deletar condição' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('regra_id') regra_id: string) {
		const condicao = await this.condicaoService.deletar(regra_id);
		return { message: 'Condição deletada com sucesso!', data: condicao };
	}

}