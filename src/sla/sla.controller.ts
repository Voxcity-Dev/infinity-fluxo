import { Body, Controller, HttpCode, Post, Put, Delete, Param, Get, BadRequestException, Logger } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SlaService } from './sla.service';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { CreateSlaDto, CreateSlaResponseDto } from './dto/create-sla.dto';
import { UpdateSlaDto, UpdateSlaResponseDto } from './dto/update-sla.dto';
import { ListSlaDto, ListSlaResponseDto } from './dto/list-sla.dto';
import { CreateSlaSchema, UpdateSlaSchema, ListSlaSchema } from 'src/schemas/sla.schema';

@ApiTags('SLA')
@Controller('sla')
@ApiBearerAuth()
export class SlaController {
	constructor(
		private readonly slaService: SlaService,
		private readonly logger: Logger
	) {}

	@Post('create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Criar um SLA' })
	@ApiOkResponse({ description: 'SLA criado com sucesso', type: CreateSlaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao criar SLA' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async criar(@Body(new ZodPipe(CreateSlaSchema)) data: CreateSlaDto) {
		const sla = await this.slaService.create(data);
		this.logger.log(`SLA criado com sucesso!`);
		return { message: 'SLA criado com sucesso!', data: sla };
	}

	@Put()
	@HttpCode(200)
	@ApiOperation({ summary: 'Atualizar um SLA' })
	@ApiOkResponse({ description: 'SLA atualizado com sucesso', type: UpdateSlaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao atualizar SLA' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async atualizar(@Body(new ZodPipe(UpdateSlaSchema)) data: UpdateSlaDto) {
		const sla = await this.slaService.update(data);
		this.logger.log(`SLA atualizado com sucesso!`);
		return { message: 'SLA atualizado com sucesso!', data: sla };
	}

	@Post('find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar todos os SLAs' })
	@ApiOkResponse({ description: 'SLAs listados com sucesso', type: ListSlaResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar SLAs' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listar(@Body(new ZodPipe(ListSlaSchema)) params: ListSlaDto) {
		const slas = await this.slaService.findAll(params);
		this.logger.log(`SLAs listados com sucesso!`);
		return { message: 'SLAs listados com sucesso!', data: slas };
	}

	@Get('tenant/:tenant_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Buscar todos os SLAs de um tenant' })
	@ApiOkResponse({ description: 'SLAs encontrados com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao buscar SLAs' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async buscarPorTenant(@Param('tenant_id') tenant_id: string) {
		if (!tenant_id) {
			throw new BadRequestException('Tenant ID é obrigatório');
		}

		const slas = await this.slaService.findByTenant(tenant_id);
		this.logger.log(`SLAs encontrados com sucesso!`);
		return { message: 'SLAs encontrados com sucesso!', data: slas };
	}

	@Get('ensure/:tenant_id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Garantir que o tenant tenha os 3 tipos de SLA' })
	@ApiOkResponse({ description: 'SLAs garantidos com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao garantir SLAs' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async garantirSlas(@Param('tenant_id') tenant_id: string) {
		if (!tenant_id) {
			throw new BadRequestException('Tenant ID é obrigatório');
		}

		const slas = await this.slaService.ensureDefaultSlas(tenant_id);
		this.logger.log(`SLAs garantidos com sucesso!`);
		return { message: 'SLAs garantidos com sucesso!', data: slas };
	}

	@Delete(':id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Deletar um SLA' })
	@ApiOkResponse({ description: 'SLA deletado com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao deletar SLA' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async deletar(@Param('id') id: string) {
		const slaId = await this.slaService.delete(id);
		this.logger.log(`SLA deletado com sucesso!`);
		return { message: 'SLA deletado com sucesso!', data: { id: slaId } };
	}
}

