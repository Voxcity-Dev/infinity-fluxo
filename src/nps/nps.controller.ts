import { Body, Controller, HttpCode, UseGuards, Post, Put, Delete, Param, Get, BadRequestException, Logger } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NpsService } from './nps.service';
import { MicroserviceTokenGuard } from 'src/common/middlewares/microservice-token.guard';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { CreateNpsDto, CreateNpsResponseDto } from './dto/create-nps.dto';
import { UpdateNpsDto, UpdateNpsResponseDto } from './dto/update-nps.dto';
import { ListNpsDto, ListNpsResponseDto } from './dto/list-nps.dto';
import { CreateNpsSetorDto, CreateNpsSetorResponseDto } from './dto/create-nps-setor.dto';
import { ListNpsSetorDto, ListNpsSetorResponseDto } from './dto/list-nps-setor.dto';
import { DeleteNpsSetorDto } from './dto/delete-nps-setor.dto';
import { NpsBySetorDto } from './dto/nps-by-setor.dto';
import { RespostaNpsDto, ResponderNpsResponseDto } from './dto/resposta-nps.dto';
import { CreateNpsSchema, UpdateNpsSchema, ListNpsSchema, CreateNpsSetorSchema, ListNpsSetorSchema, DeleteNpsSetorSchema, ExecuteNpsSchema, RespostaNpsSchema } from 'src/schemas/nps.schema';
@ApiTags('NPS')
@Controller('nps')
@UseGuards(MicroserviceTokenGuard)
export class NpsController {
	constructor(
		private readonly npsService: NpsService,
		private readonly logger: Logger
	) {}

    @Get(':setor_id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Buscar um NPS por setor' })
    @ApiOkResponse({ description: 'NPS encontrado com sucesso', type: NpsBySetorDto })
    @ApiResponse({ status: 400, description: 'Erro ao buscar NPS' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 404, description: 'NPS não encontrado para este setor' })
    async buscar(@Param('setor_id') setor_id: string) {
        
        if (!setor_id) {
            throw new BadRequestException('Setor ID é obrigatório');
        }

        const nps = await this.npsService.findBySetorId(setor_id);
        
		this.logger.log(`NPS encontrado com sucesso!`);

        return { message: 'NPS encontrado com sucesso!', data: nps };
    }

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: 'Responder um NPS' })
    @ApiOkResponse({ description: 'NPS respondido com sucesso', type: ResponderNpsResponseDto, example: { resposta: 'Obrigado por responder a pesquisa!' } })
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

	// Rotas para NpsSetor
	@Post('setor/create')
	@HttpCode(200)
	@ApiOperation({ summary: 'Vincular setor ao NPS' })
	@ApiOkResponse({ description: 'Setor vinculado com sucesso', type: CreateNpsSetorResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao vincular setor' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async vincularSetor(@Body(new ZodPipe(CreateNpsSetorSchema)) data: CreateNpsSetorDto) {
		const npsSetor = await this.npsService.createSetor(data);
		this.logger.log(`Setor vinculado com sucesso!`);
		return { message: 'Setor vinculado com sucesso!', data: npsSetor };
	}

	@Post('setor/find')
	@HttpCode(200)
	@ApiOperation({ summary: 'Listar setores de um NPS' })
	@ApiOkResponse({ description: 'Setores listados com sucesso', type: ListNpsSetorResponseDto })
	@ApiResponse({ status: 400, description: 'Erro ao listar setores' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	@ApiResponse({ status: 422, description: 'Dados de validação inválidos' })
	async listarSetores(@Body(new ZodPipe(ListNpsSetorSchema)) params: ListNpsSetorDto) {
		const setores = await this.npsService.findSetoresByNpsId(params);
		this.logger.log(`Setores listados com sucesso!`);
		return { message: 'Setores listados com sucesso!', data: setores };
	}

	@Delete('setor/:id')
	@HttpCode(200)
	@ApiOperation({ summary: 'Remover vínculo de setor' })
	@ApiOkResponse({ description: 'Vínculo removido com sucesso' })
	@ApiResponse({ status: 400, description: 'Erro ao remover vínculo' })
	@ApiResponse({ status: 401, description: 'Não autorizado' })
	async removerSetor(@Param('id') id: string) {
		const setId = await this.npsService.deleteSetor({ id });
		this.logger.log(`Vínculo removido com sucesso!`);
		return { message: 'Vínculo removido com sucesso!', data: { id: setId } };
	}
}