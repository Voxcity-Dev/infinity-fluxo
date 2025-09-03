import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
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
}