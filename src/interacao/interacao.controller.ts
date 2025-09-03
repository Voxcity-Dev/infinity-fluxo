import { Body, Controller, Post, HttpCode, UseGuards, Get, Param, Put } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { InteracaoService } from './interacao.service';
import { CreateInteracaoDto, CreateInteracaoResponseDto } from './dto/create-interacao.dto';
import { CreateInteracaoSchema } from 'src/schemas/interacao.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { ListInteracoesInput, ListInteracoesResponseDto } from './dto/list-interacao.dto';
import { UpdateInteracaoDto, UpdateInteracaoResponseDto } from './dto/update-interacao.dto';

@ApiTags('Interação')
@Controller('interacao')
@UseGuards(MicroserviceTokenGuard)
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
	@ApiOkResponse({ description: 'Interações listadas com sucesso', type: ListInteracoesResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar interações' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async listar(@Body() params: ListInteracoesInput) {
		const interacoes = await this.interacaoService.findAll(params);
		return { message: 'Interações listadas com sucesso!', data: interacoes };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova interação' })
	@ApiOkResponse({ description: 'Interação criada com sucesso', type: CreateInteracaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async criar(@Body() data: CreateInteracaoDto) {
		const interacao = await this.interacaoService.create(data);
		return { message: 'Interação criada com sucesso!', data: interacao };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar uma interação' })
	@ApiOkResponse({ description: 'Interação atualizada com sucesso', type: UpdateInteracaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar interação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async atualizar(@Body() data: UpdateInteracaoDto) {
		console.log(data);
		const interacao = await this.interacaoService.update(data);
		return { message: 'Interação atualizada com sucesso!', data: interacao };
	}
}