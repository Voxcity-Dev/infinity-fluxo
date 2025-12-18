import { Controller, Get, Query, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('nps-metrics')
  @ApiOperation({ summary: 'Obtém métricas NPS' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Métricas NPS retornadas' })
  async getNpsMetrics(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalNps: number;
    totalRespostas: number;
    taxaResposta: number;
    scoreNPS: number;
    distribuicao: Array<{ nota: number; quantidade: number; percentual: number }>;
  }> {
    this.logger.log(
      `GET nps-metrics - Tenant: ${tenantId || 'all'}, Start: ${startDate}, End: ${endDate}`,
    );

    return this.dashboardService.getNpsMetrics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('nps-analysis')
  @ApiOperation({ summary: 'Obtém análise detalhada de NPS' })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'npsId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Análise NPS retornada' })
  async getNpsAnalysis(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('npsId') npsId?: string,
  ): Promise<{
    scoreGeral: number;
    npsPorCanal: Array<{ canalId?: string; nome: string; score: number; totalRespostas: number }>;
    npsPorFila: Array<{ filaId?: string; nome: string; score: number; totalRespostas: number }>;
    npsPorSetor: Array<{ setorId?: string; nome: string; score: number; totalRespostas: number }>;
    evolucaoTemporal: Array<{ data: string; score: number; totalRespostas: number }>;
  }> {
    this.logger.log(
      `GET nps-analysis - Tenant: ${tenantId || 'all'}, Start: ${startDate}, End: ${endDate}`,
    );

    return this.dashboardService.getNpsAnalysis(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      npsId,
    );
  }
}

