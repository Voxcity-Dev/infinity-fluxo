import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { EtapaService } from './etapa.service';
import { CreateEtapaDto, CreateEtapaResponseDto } from './dto/create-etapa.dto';
import { CreateEtapaSchema } from 'src/schemas/etapa.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';

@ApiTags('Etapa')
@Controller('etapa')
@UseGuards(MicroserviceTokenGuard)
export class EtapaController {
	constructor(private readonly etapaService: EtapaService) {}

	// Exemplo de rota comentada
	/*
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
	) {
		const etapa = await this.etapaService.create(data);

		return {
			message: 'Etapa criada com sucesso!',
			data: etapa,
		};
	}
	*/
}