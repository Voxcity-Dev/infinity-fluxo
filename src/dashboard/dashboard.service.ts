import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém métricas NPS
   */
  async getNpsMetrics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalNps: number;
    totalRespostas: number;
    taxaResposta: number;
    scoreNPS: number;
    distribuicao: Array<{ nota: number; quantidade: number; percentual: number }>;
  }> {
    try {
      this.logger.log(`Obtendo métricas NPS${tenantId ? ` para tenant: ${tenantId}` : ''}`);

      const whereNps: any = { is_deleted: false };
      if (tenantId) {
        whereNps.tenant_id = tenantId;
      }

      const whereResposta: any = {};
      if (startDate) {
        whereResposta.created_at = { gte: startDate };
      }
      if (endDate) {
        whereResposta.created_at = { ...whereResposta.created_at, lte: endDate };
      }

      const [totalNps, respostas] = await Promise.all([
        this.prisma.nps.count({ where: whereNps }),
        this.prisma.npsResposta.findMany({
          where: whereResposta,
          include: {
            nps: {
              where: whereNps,
            },
          },
        }),
      ]);

      const respostasFiltradas = respostas.filter((r) => r.nps);
      const totalRespostas = respostasFiltradas.length;

      // Calcular distribuição
      const distribuicaoMap = new Map<number, number>();
      for (let i = 0; i <= 10; i++) {
        distribuicaoMap.set(i, 0);
      }

      respostasFiltradas.forEach((r) => {
        const nota = r.resposta;
        distribuicaoMap.set(nota, (distribuicaoMap.get(nota) || 0) + 1);
      });

      const distribuicao = Array.from(distribuicaoMap.entries()).map(([nota, quantidade]) => ({
        nota,
        quantidade,
        percentual: totalRespostas > 0 ? (quantidade / totalRespostas) * 100 : 0,
      }));

      // Calcular NPS: % Promotores (9-10) - % Detratores (0-6)
      const promotores = respostasFiltradas.filter((r) => r.resposta >= 9).length;
      const detratores = respostasFiltradas.filter((r) => r.resposta <= 6).length;
      const percentualPromotores = totalRespostas > 0 ? (promotores / totalRespostas) * 100 : 0;
      const percentualDetratores = totalRespostas > 0 ? (detratores / totalRespostas) * 100 : 0;
      const scoreNPS = percentualPromotores - percentualDetratores;

      // Taxa de resposta (será calculada com base em tickets que receberam NPS)
      const taxaResposta = 0; // Será calculado quando tivermos dados de tickets

      return {
        totalNps,
        totalRespostas,
        taxaResposta,
        scoreNPS: Math.round(scoreNPS * 100) / 100,
        distribuicao,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métricas NPS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém análise detalhada de NPS
   */
  async getNpsAnalysis(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
    npsId?: string,
  ): Promise<{
    scoreGeral: number;
    npsPorCanal: Array<{ canalId?: string; nome: string; score: number; totalRespostas: number }>;
    npsPorFila: Array<{ filaId?: string; nome: string; score: number; totalRespostas: number }>;
    npsPorSetor: Array<{ setorId?: string; nome: string; score: number; totalRespostas: number }>;
    evolucaoTemporal: Array<{ data: string; score: number; totalRespostas: number }>;
  }> {
    try {
      this.logger.log(`Obtendo análise NPS${tenantId ? ` para tenant: ${tenantId}` : ''}`);

      const where: any = {};
      if (startDate) {
        where.created_at = { gte: startDate };
      }
      if (endDate) {
        where.created_at = { ...where.created_at, lte: endDate };
      }
      if (npsId) {
        where.nps_id = npsId;
      }

      const respostas = await this.prisma.npsResposta.findMany({
        where,
        include: {
          nps: {
            where: tenantId ? { tenant_id: tenantId, is_deleted: false } : { is_deleted: false },
          },
        },
      });

      const respostasFiltradas = respostas.filter((r) => r.nps);

      // Calcular score geral
      const promotores = respostasFiltradas.filter((r) => r.resposta >= 9).length;
      const detratores = respostasFiltradas.filter((r) => r.resposta <= 6).length;
      const total = respostasFiltradas.length;
      const percentualPromotores = total > 0 ? (promotores / total) * 100 : 0;
      const percentualDetratores = total > 0 ? (detratores / total) * 100 : 0;
      const scoreGeral = percentualPromotores - percentualDetratores;

      return {
        scoreGeral: Math.round(scoreGeral * 100) / 100,
        npsPorCanal: [],
        npsPorFila: [],
        npsPorSetor: [],
        evolucaoTemporal: [],
      };
    } catch (error) {
      this.logger.error(`Erro ao obter análise NPS: ${error.message}`);
      throw error;
    }
  }
}

