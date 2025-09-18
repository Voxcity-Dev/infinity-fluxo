import { Body, Controller, Post, HttpCode, UseGuards, Put, Delete, Param } from '@nestjs/common';
import {
	ApiHeader,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { CondicaoService } from './condicao.service';
import { CreateCondicaoDto, CreateCondicaoResponseDto } from './dto/create-condicao.dto';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { ListCondicoesInput, ListCondicoesResponseDto } from './dto/list-condicao.dto';
import { UpdateCondicaoRegraDto } from './dto/update-condicao-regra.dto';

@ApiTags('Condição')
@ApiHeader({
	name: 'x-microservice-token',
	description: 'Token do microserviço',
	required: true,
})
@Controller('condicao')
@UseGuards(MicroserviceTokenGuard)
export class CondicaoController {
	constructor(private readonly condicaoService: CondicaoService) {}
	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar as condições de uma etapa' })
	@ApiOkResponse({ description: 'Condições listadas com sucesso', type: ListCondicoesResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar condições' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async listar(@Body() params: ListCondicoesInput) {
		const condicoes = await this.condicaoService.find(params);
		return { message: 'Condições listadas com sucesso!', data: condicoes };
	}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar uma nova condição' })
	@ApiOkResponse({ description: 'Condição criada com sucesso', type: CreateCondicaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar condição' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async criar(@Body() data: CreateCondicaoDto) {
		const condicao = await this.condicaoService.create(data);
		return { message: 'Condição criada com sucesso!', data: condicao };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar as regras de uma condição' })
	@ApiOkResponse({ description: 'Regras atualizadas com sucesso', type: CreateCondicaoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar regras' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async atualizar(@Body() data: UpdateCondicaoRegraDto) {
		const condicao = await this.condicaoService.updateRegras(data);
		return { message: 'Regras atualizadas com sucesso!', data: condicao };
	}

	@Delete(':regra_id')
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