import { Body, Controller, HttpCode, Post, Put, Delete, Param, Get, Query, BadRequestException, Logger } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NpsService } from './nps.service';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { CreateNpsDto, CreateNpsResponseDto } from './dto/create-nps.dto';
import { UpdateNpsDto, UpdateNpsResponseDto } from './dto/update-nps.dto';
import { ListNpsDto, ListNpsResponseDto } from './dto/list-nps.dto';
import { CreateNpsFilaDto, CreateNpsFilaResponseDto } from './dto/create-nps-fila.dto';
import { ListNpsFilaDto, ListNpsFilaResponseDto } from './dto/list-nps-fila.dto';
import { DeleteNpsFilaDto } from './dto/delete-nps-fila.dto';
import { NpsByFilaDto } from './dto/nps-by-fila.dto';
import { RespostaNpsDto, ResponderNpsResponseDto } from './dto/resposta-nps.dto';
import { CreateNpsFilaSchema, ListNpsFilaSchema, DeleteNpsFilaSchema, RespostaNpsSchema, CreateNpsSchema, UpdateNpsSchema, ListNpsSchema } from 'src/schemas/nps.schema';
@ApiTags('NPS')
@Controller('nps')
export class NpsController {
	constructor(
		private readonly npsService: NpsService,
		private readonly logger: Logger
	) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: 'Responder um NPS' })
    @ApiOkResponse({ description: 'NPS respondido com sucesso', type: ResponderNpsResponseDto, example: { resposta: 'Obrigado por responder a pesquisa!', nps_id: '123e4567-e89b-12d3-a456-426614174000' } })
    @ApiResponse({ status: 400, description: 'Erro ao responder NPS' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
    async responder(@Body(new ZodPipe(RespostaNpsSchema)) data: RespostaNpsDto) {
        const nps = await this.npsService.responder(data);
		this.logger.log(`NPS respondido com sucesso!`);
        return { message: 'NPS respondido com sucesso!', data: nps };
    }


	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar um NPS' })
	@ApiOkResponse({ description: 'NPS criado com sucesso', type: CreateNpsResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar NPS' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async criar(@Body(new ZodPipe(CreateNpsSchema)) data: CreateNpsDto) {
		const nps = await this.npsService.create(data);
		this.logger.log(`NPS criado com sucesso!`);
		return { message: 'NPS criado com sucesso!', data: nps };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar um NPS' })
	@ApiOkResponse({ description: 'NPS atualizado com sucesso', type: UpdateNpsResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar NPS' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(@Body(new ZodPipe(UpdateNpsSchema)) data: UpdateNpsDto) {
		const nps = await this.npsService.update(data);
		this.logger.log(`NPS atualizado com sucesso!`);
		return { message: 'NPS atualizado com sucesso!', data: nps };
	}

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todos os NPS' })
	@ApiOkResponse({ description: 'NPS listados com sucesso', type: ListNpsResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar NPS' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(@Body(new ZodPipe(ListNpsSchema)) params: ListNpsDto) {
		const nps = await this.npsService.findAll(params);
		this.logger.log(`NPS listados com sucesso!`);
		return { message: 'NPS listados com sucesso!', data: nps };
	}

	@Delete(':id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar um NPS' })
	@ApiOkResponse({ description: 'NPS deletado com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao deletar NPS' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('id') id: string) {
		const npsId = await this.npsService.delete(id);
		this.logger.log(`NPS deletado com sucesso!`);
		return { message: 'NPS deletado com sucesso!', data: { id: npsId } };
	}

	@Get('scores-by-tickets')
	@HttpCode(200)
	@ApiOperation({
		summary: 'Buscar scores NPS por ticket IDs',
		description: 'Retorna mapa ticketId → score. Usado pelo infinity-ia para popular o pool de aprendizado.',
	})
	@ApiResponse({ status: 200, description: 'Scores retornados com sucesso' })
	async scoresByTickets(
		@Query('ticket_ids') ticketIds: string,
		@Query('tenant_id') tenantId: string,
	) {
		const ids = ticketIds?.split(',').filter(Boolean) ?? [];
		if (ids.length === 0) {
			return { message: 'Nenhum ticket informado', data: { scores: {} } };
		}
		const scores = await this.npsService.getScoresByTicketIds(ids, tenantId);
		this.logger.log(`Scores NPS retornados para ${ids.length} tickets`);
		return { message: 'Scores NPS retornados com sucesso', data: { scores } };
	}

	// Rotas para NpsFila
	@Get('fila/:fila_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Buscar um NPS por fila de atendimento' })
	@ApiOkResponse({ description: 'NPS encontrado com sucesso', type: NpsByFilaDto })
	@ApiResponse({ status: 400, description: 'Erro ao buscar NPS' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 404, description: 'NPS não encontrado para esta fila' })
	async buscarPorFila(@Param('fila_id') fila_id: string) {
		if (!fila_id) {
			throw new BadRequestException('Fila ID é obrigatório');
		}

		const nps = await this.npsService.findByFilaId(fila_id);
		this.logger.log(`NPS encontrado com sucesso para fila ${fila_id}!`);
		return { message: 'NPS encontrado com sucesso!', data: nps };
	}

	@Get('fila/:fila_id/expiracao')
	@HttpCode(200)
	@ApiOperation({ summary: 'Buscar configuração de expiração NPS por fila (usado pelo Cron)' })
	@ApiOkResponse({ description: 'Configuração de expiração encontrada' })
	@ApiResponse({ status: 400, description: 'Erro ao buscar configuração' })
	@ApiResponse({ status: 404, description: 'NPS não encontrado para esta fila' })
	async buscarExpiracaoPorFila(@Param('fila_id') fila_id: string) {
		if (!fila_id) {
			throw new BadRequestException('Fila ID é obrigatório');
		}

		const config = await this.npsService.findExpiracaoByFilaId(fila_id);
		this.logger.log(`Config expiração NPS encontrada para fila ${fila_id}`);
		return config;
	}

	@Post('fila/create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Vincular fila ao NPS' })
	@ApiOkResponse({ description: 'Fila vinculada com sucesso', type: CreateNpsFilaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao vincular fila' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async vincularFila(@Body(new ZodPipe(CreateNpsFilaSchema)) data: CreateNpsFilaDto) {
		const npsFila = await this.npsService.createFila(data);
		this.logger.log(`Fila vinculada com sucesso!`);
		return { message: 'Fila vinculada com sucesso!', data: npsFila };
	}

	@Post('fila/find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar filas de um NPS' })
	@ApiOkResponse({ description: 'Filas listadas com sucesso', type: ListNpsFilaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar filas' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listarFilas(@Body(new ZodPipe(ListNpsFilaSchema)) params: ListNpsFilaDto) {
		const filas = await this.npsService.findFilasByNpsId(params);
		this.logger.log(`Filas listadas com sucesso!`);
		return { message: 'Filas listadas com sucesso!', data: filas };
	}

	@Delete('fila/:id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Remover vínculo de fila' })
	@ApiOkResponse({ description: 'Vínculo removido com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao remover vínculo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async removerFila(@Param('id') id: string) {
		const filaId = await this.npsService.deleteFila({ id });
		this.logger.log(`Vínculo de fila removido com sucesso!`);
		return { message: 'Vínculo removido com sucesso!', data: { id: filaId } };
	}
}