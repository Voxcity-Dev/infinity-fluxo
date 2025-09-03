import { Body, Controller, Post, HttpCode, UseGuards, Get, Param, Put, Delete } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { FluxoService } from './fluxo.service';
import { CreateFluxoDto, CreateFluxoInput, CreateFluxoResponseDto } from './dto/create-fluxo.dto';
import { CreateFluxoSchema } from 'src/schemas/fluxo.schema';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { FluxoResponseDto, ListFluxosInput, ListFluxosResponseDto } from './dto/list-fluxo.dto';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';

@ApiTags('Fluxo')
@Controller('fluxo')
@UseGuards(MicroserviceTokenGuard)
export class FluxoController {
	constructor(private readonly fluxoService: FluxoService) {}

	// Exemplo de rota comentada
	// @Post()
	// @HttpCode(201)
	// @ApiOperation({ summary: 'Criar um novo fluxo' })
	// @ApiOkResponse({
	// 	description: 'Fluxo criado com sucesso',
	// 	type: CreateFluxoResponseDto,
	// })
	// @ApiResponse({ status: 400, description: 'Erro ao criar fluxo' })
	// @ApiResponse({ status: 401, description: 'Não autorizado' })
	// @ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	// async create(
	// 	@Body(new ZodPipe(CreateFluxoSchema)) data: CreateFluxoDto,
	// ) {
	// 	const fluxo = await this.fluxoService.create(data);

	// 	return {
	// 		message: 'Fluxo criado com sucesso!',
	// 		data: fluxo,
	// 	};
	// }

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todos os fluxos' })
	@ApiOkResponse({ description: 'Fluxos listados com sucesso', type: ListFluxosResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar fluxos' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(@Body() params: ListFluxosInput) {
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
	async criar(@Body() data: CreateFluxoInput) {
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

	// @Put(':fluxo_id')

	@Put('/configuracao')
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar configuração do fluxo' })
	@ApiOkResponse({ description: 'Configuração atualizada com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar configuração do fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async atualizarConfiguracao(@Body() data: UpdateFluxoConfiguracaoInput) {
		const configuracao = await this.fluxoService.updateConfiguracao(data);
		return { message: 'Configuração atualizada com sucesso!', data: configuracao };
	}
}