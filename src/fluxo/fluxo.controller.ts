import { Body, Controller, Post, HttpCode, UseGuards, Get, Param, Put, Delete, Logger } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiBody,
} from '@nestjs/swagger';
import { FluxoService } from './fluxo.service';
import { CreateFluxoInput } from './dto/create-fluxo.dto';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { FluxoEngineInput, FluxoEngineInputDto, FluxoEngineResponseDto, FluxoResponseDto, ListFluxosInput, ListFluxosResponseDto, ListFluxosSchema } from './dto/list-fluxo.dto';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { UpdateFluxoInput } from './dto/update-fluxo.dto';
import { CreateFluxoSchema, UpdateFluxoSchema, UpdateFlowConfiguracaoSchema } from 'src/schemas/fluxo.schema';

@ApiTags('Fluxo')
@Controller('fluxo')
@UseGuards(MicroserviceTokenGuard)
export class FluxoController {
	constructor(private readonly fluxoService: FluxoService) {}

	@Post()
	@HttpCode(200)
	@ApiOperation({ summary: 'Executar um fluxo' })
	@ApiBody({ type: FluxoEngineInputDto })
	@ApiOkResponse({ description: 'Fluxo executado com sucesso', type: FluxoEngineResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao executar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async executar(@Body() data: FluxoEngineInput) {
		console.log('data', JSON.stringify(data, null, 2));
		const fluxo = await this.fluxoService.engine(data);
		return { message: 'Fluxo executado com sucesso!', data: fluxo };
	}

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todos os fluxos' })
	@ApiOkResponse({ description: 'Fluxos listados com sucesso', type: ListFluxosResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar fluxos' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(@Body(new ZodPipe(ListFluxosSchema)) params: ListFluxosInput) {
		const fluxos = await this.fluxoService.findAll(params);
		return { message: 'Fluxos listados com sucesso!', data: fluxos };
	}

	@Get(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Obter um fluxo pelo ID' })
	@ApiOkResponse({ description: 'Fluxo obtido com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao obter fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async obter(@Param('fluxo_id') fluxo_id: string) {
		const fluxo = await this.fluxoService.findById(fluxo_id);
		return { message: 'Fluxo obtido com sucesso!', data: fluxo };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar um fluxo' })
	@ApiOkResponse({ description: 'Fluxo criado com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async criar(@Body(new ZodPipe(CreateFluxoSchema)) data: CreateFluxoInput) {
		const fluxo = await this.fluxoService.create(data);
		return { message: 'Fluxo criado com sucesso!', data: fluxo };
	}

	@Delete(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar um fluxo' })
	@ApiOkResponse({ description: 'Fluxo deletado com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao deletar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('fluxo_id') fluxo_id: string) {
		const fluxo = await this.fluxoService.delete(fluxo_id);
		return { message: 'Fluxo deletado com sucesso!', data: fluxo };
	}

	@Put(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar um fluxo' })
	@ApiOkResponse({ description: 'Fluxo atualizado com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(@Param('fluxo_id') fluxo_id: string, @Body(new ZodPipe(UpdateFluxoSchema)) data: UpdateFluxoInput) {
		const fluxo = await this.fluxoService.update({ id: fluxo_id, ...data });
		return { message: 'Fluxo atualizado com sucesso!', data: fluxo };
	}

	// @Put(':fluxo_id')

	@Put('configuracao')
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar configuração do fluxo' })
	@ApiOkResponse({ description: 'Configuração atualizada com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar configuração do fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizarConfiguracao(@Body(new ZodPipe(UpdateFlowConfiguracaoSchema)) data: UpdateFluxoConfiguracaoInput) {
		const configuracao = await this.fluxoService.updateConfiguracao(data);
		return { message: 'Configuração atualizada com sucesso!', data: configuracao };
	}
}