import { Body, Controller, Post, HttpCode, UseGuards, Param, Get, Delete, Put } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { EtapaService } from './etapa.service';
import { CreateEtapaDto, CreateEtapaInput, CreateEtapaResponseDto } from './dto/create-etapa.dto';
import { CreateEtapaSchema, EtapaSchema } from 'src/schemas/etapa.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { EtapaResponseDto, ListEtapasInput, ListEtapasResponseDto } from './dto/list-etapa.dto';
import { UpdateEtapaInput } from './dto/update-etapa.dto';

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

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todas as etapas' })
	@ApiOkResponse({ description: 'Etapas listadas com sucesso', type: ListEtapasResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar etapas' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async listar(@Body() params: ListEtapasInput) {
		const etapas = await this.etapaService.findAll(params);
		return { message: 'Etapas listadas com sucesso!', data: etapas };
	}

	@Get(':etapa_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Buscar uma etapa por ID' })
	@ApiOkResponse({ description: 'Etapa encontrada com sucesso', type: EtapaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao buscar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'Etapa não encontrada' })
	async buscar(@Param('etapa_id') etapa_id: string) {
		const etapa = await this.etapaService.findById(etapa_id);
		return { message: 'Etapa encontrada com sucesso!', data: etapa };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova etapa' })
	@ApiOkResponse({ description: 'Etapa criada com sucesso', type: EtapaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async criar(@Body() data: CreateEtapaInput) {
		const etapa = await this.etapaService.create(data);
		return { message: 'Etapa criada com sucesso!', data: etapa };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar uma etapa' })
	@ApiOkResponse({ description: 'Etapa atualizada com sucesso', type: EtapaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async atualizar(@Body() data: UpdateEtapaInput) {
		const etapa = await this.etapaService.update(data);
		return { message: 'Etapa atualizada com sucesso!', data: etapa };
	}

	@Delete(':etapa_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar uma etapa' })
	@ApiOkResponse({ description: 'Etapa deletada com sucesso', type: EtapaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao deletar etapa' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('etapa_id') etapa_id: string) {
		const etapa = await this.etapaService.delete(etapa_id);
		return { message: 'Etapa deletada com sucesso!', data: etapa };
	}


}