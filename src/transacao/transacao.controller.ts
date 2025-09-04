import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import {
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

@ApiTags('Transação')
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
	@ApiOperation({ summary: 'Listar todas as transações' })
	@ApiOkResponse({ description: 'Transações listadas com sucesso', type: ListTransacoesResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar transações' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async listar(@Body() params: ListTransacoesInput) {
		const transacoes = await this.transacaoService.find(params);
		return { message: 'Transações listadas com sucesso!', data: transacoes };
	}


}