import {
	Body,
	Controller,
	Post,
	HttpCode,
	Get,
	Param,
	Put,
	Delete,
	Req,
	BadRequestException,
	Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { FluxoService } from './fluxo.service';
import { CreateFluxoInput } from './dto/create-fluxo.dto';
import {
	FluxoEngineInput,
	FluxoEngineInputDto,
	FluxoEngineResponseDto,
	FluxoResponseDto,
	ListFluxosInput,
	ListFluxosResponseDto,
	ListFluxosSchema,
} from './dto/list-fluxo.dto';
import { UpdateFluxoConfiguracaoInput } from './dto/update-fluxo-configuracao.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { UpdateFluxoInput } from './dto/update-fluxo.dto';
import {
	CreateFluxoSchema,
	UpdateFluxoSchema,
	UpdateFlowConfiguracaoSchema,
} from 'src/schemas/fluxo.schema';

@ApiTags('Fluxo')
@Controller('fluxo')
export class FluxoController {
	private readonly logger = new Logger(FluxoController.name);

	constructor(private readonly fluxoService: FluxoService) {}

	@Post()
	@HttpCode(200)
	@ApiOperation({ summary: 'Executar um fluxo' })
	@ApiBody({ type: FluxoEngineInputDto })
	@ApiOkResponse({ description: 'Fluxo executado com sucesso', type: FluxoEngineResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao executar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async executar(@Body() data: FluxoEngineInput) {
		this.logger.log('POST /fluxo - Executar fluxo acessado');
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
	async listar(
		@Body(new ZodPipe(ListFluxosSchema)) params: ListFluxosInput,
		@Req() request: Request,
	) {
		this.logger.log('POST /fluxo/find - Listar fluxos acessado');
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const fluxos = await this.fluxoService.findAll({ ...params, tenant_id } as ListFluxosInput);
		return { message: 'Fluxos listados com sucesso!', data: fluxos };
	}

	@Get(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Obter um fluxo pelo ID' })
	@ApiOkResponse({ description: 'Fluxo obtido com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao obter fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async obter(@Param('fluxo_id') fluxo_id: string) {
		this.logger.log(`GET /fluxo/:fluxo_id - Obter fluxo acessado (ID: ${fluxo_id})`);
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
	async criar(
		@Body(new ZodPipe(CreateFluxoSchema)) data: CreateFluxoInput,
		@Req() request: Request,
	) {
		this.logger.log('POST /fluxo/create - Criar fluxo acessado');
		const tenant_id = (request['user']?.tenant_id ||
			request['tenant_id'] ||
			request['micro']?.tenant_id) as string;

		if (!tenant_id) {
			throw new BadRequestException('tenant_id não encontrado no token');
		}

		const fluxo = await this.fluxoService.create({ ...data, tenant_id } as CreateFluxoInput);
		return { message: 'Fluxo criado com sucesso!', data: fluxo };
	}

	@Delete(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar um fluxo' })
	@ApiOkResponse({ description: 'Fluxo deletado com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao deletar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('fluxo_id') fluxo_id: string) {
		this.logger.log(`DELETE /fluxo/:fluxo_id - Deletar fluxo acessado (ID: ${fluxo_id})`);
		const fluxo = await this.fluxoService.delete(fluxo_id);
		return { message: 'Fluxo deletado com sucesso!', data: fluxo };
	}

	@Put('configuracao')
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar configuração do fluxo' })
	@ApiOkResponse({ description: 'Configuração atualizada com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar configuração do fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizarConfiguracao(
		@Body(new ZodPipe(UpdateFlowConfiguracaoSchema)) data: UpdateFluxoConfiguracaoInput,
	) {
		this.logger.log('PUT /fluxo/configuracao - Atualizar configuração do fluxo acessado');
		const configuracao = await this.fluxoService.updateConfiguracao(data);
		return { message: 'Configuração atualizada com sucesso!', data: configuracao };
	}

	@Put(':fluxo_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar um fluxo' })
	@ApiOkResponse({ description: 'Fluxo atualizado com sucesso', type: FluxoResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar fluxo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(
		@Param('fluxo_id') fluxo_id: string,
		@Body(new ZodPipe(UpdateFluxoSchema)) data: UpdateFluxoInput,
	) {
		this.logger.log(`PUT /fluxo/:fluxo_id - Atualizar fluxo acessado (ID: ${fluxo_id})`);
		const fluxo = await this.fluxoService.update({ id: fluxo_id, ...data });
		return { message: 'Fluxo atualizado com sucesso!', data: fluxo };
	}

	@Get(':fluxo_id/expiracao')
	@HttpCode(200)
	@ApiOperation({ summary: 'Obter configurações de expiração do fluxo' })
	@ApiOkResponse({ description: 'Configurações de expiração obtidas com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao obter configurações de expiração' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async obterExpiracao(@Param('fluxo_id') fluxo_id: string) {
		this.logger.log(`GET /fluxo/${fluxo_id}/expiracao - Solicitado pelo cron`);
		const config = await this.fluxoService.getExpiracaoConfig(fluxo_id);
		this.logger.log(`  Triagem: ${config.triagem.habilitada ? `${config.triagem.minutos}min` : 'desabilitada'}`);
		this.logger.log(`  NPS: ${config.nps.habilitada ? `${config.nps.horas}h` : 'desabilitada'}`);
		return { message: 'Configurações obtidas com sucesso!', data: config };
	}
}
