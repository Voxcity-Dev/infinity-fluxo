import { Body, Controller, Post, HttpCode, UseGuards, Put, Delete, Param } from '@nestjs/common';
import {
	ApiHeader,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { TransacaoService } from './transacao.service';
import { CreateTransacaoDto, CreateTransacaoResponseDto } from './dto/create-transacao.dto';
import { CreateTransacaoSchema } from 'src/schemas/transacao.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { ListTransacoesInput, ListTransacoesResponseDto } from './dto/list-transacao.dto';
import { UpdateTransacaoRegraDto } from './dto/update-transacao-regra.dto';

@ApiTags('Transação')
@ApiHeader({
	name: 'x-microservice-token',
	description: 'Token do microserviço',
	required: true,
})
@Controller('transacao')
@UseGuards(MicroserviceTokenGuard)
export class TransacaoController {
	constructor(private readonly transacaoService: TransacaoService) {}

	// Exemplo de rota comentada
	/*
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
	) {
		const transacao = await this.transacaoService.create(data);

		return {
			message: 'Transação criada com sucesso!',
			data: transacao,
		};
	}
	*/
	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar as transações de uma etapa' })
	@ApiOkResponse({ description: 'Transações listadas com sucesso', type: ListTransacoesResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar transações' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async listar(@Body() params: ListTransacoesInput) {
		const transacoes = await this.transacaoService.find(params);
		return { message: 'Transações listadas com sucesso!', data: transacoes };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova transação' })
	@ApiOkResponse({ description: 'Transação criada com sucesso', type: CreateTransacaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar transação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async criar(@Body() data: CreateTransacaoDto) {
		const transacao = await this.transacaoService.create(data);
		return { message: 'Transação criada com sucesso!', data: transacao };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar as regras de uma transação' })
	@ApiOkResponse({ description: 'Regras atualizadas com sucesso', type: CreateTransacaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar regras' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async atualizar(@Body() data: UpdateTransacaoRegraDto) {
		const transacao = await this.transacaoService.updateRegras(data);
		return { message: 'Regras atualizadas com sucesso!', data: transacao };
	}

	@Delete(':transacao_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar uma transação' })
	@ApiOkResponse({ description: 'Transação deletada com sucesso', type: CreateTransacaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao deletar transação' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('transacao_id') transacao_id: string) {
		const transacao = await this.transacaoService.deletar(transacao_id);
		return { message: 'Transação deletada com sucesso!', data: transacao };
	}

}