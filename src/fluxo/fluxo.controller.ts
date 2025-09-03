import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { FluxoService } from './fluxo.service';
import { CreateFluxoDto, CreateFluxoResponseDto } from './dto/create-fluxo.dto';
import { CreateFluxoSchema } from 'src/schemas/fluxo.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';

@ApiTags('Fluxo')
@Controller('fluxo')
@UseGuards(MicroserviceTokenGuard)
export class FluxoController {
	constructor(private readonly fluxoService: FluxoService) {}

	// Exemplo de rota comentada
	/*
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
	) {
		const fluxo = await this.fluxoService.create(data);

		return {
			message: 'Fluxo criado com sucesso!',
			data: fluxo,
		};
	}
	*/
}