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

      // Primeiro, buscar os IDs dos NPS que atendem aos critérios (filtro por tenant_id)
      const npsIds = await this.prisma.nps.findMany({
        where: whereNps,
        select: { id: true, tenant_id: true },
      });
      const npsIdsArray = npsIds.map((n) => n.id);

      // Se não houver NPS, retornar valores zerados
      if (npsIdsArray.length === 0) {
        return {
          totalNps: 0,
          totalRespostas: 0,
          taxaResposta: 0,
          scoreNPS: 0,
          distribuicao: Array.from({ length: 11 }, (_, i) => ({
            nota: i,
            quantidade: 0,
            percentual: 0,
          })),
        };
      }

      // Construir where para respostas incluindo filtro de nps_id e data
      // Usar a relação nps_resposta -> nps -> tenant_id através do include
      const whereRespostaCompleto = {
        ...whereResposta,
        nps_id: { in: npsIdsArray },
      };

      const [totalNps, respostas] = await Promise.all([
        this.prisma.nps.count({ where: whereNps }),
        this.prisma.npsResposta.findMany({
          where: whereRespostaCompleto,
          include: {
            nps: {
              select: {
                id: true,
                tenant_id: true,
                is_deleted: true,
              },
            },
          },
        }),
      ]);

      // Filtrar respostas que pertencem a NPS válidos e do tenant correto
      const respostasFiltradas = respostas.filter((r) => {
        if (!r.nps || r.nps.is_deleted) return false;
        // Se foi passado tenantId, garantir que o NPS pertence a esse tenant
        if (tenantId && r.nps.tenant_id !== tenantId) return false;
        return true;
      });
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

      // Primeiro, buscar os IDs dos NPS que atendem aos critérios
      const whereNps: any = { is_deleted: false };
      if (tenantId) {
        whereNps.tenant_id = tenantId;
      }

      const npsIds = await this.prisma.nps.findMany({
        where: whereNps,
        select: { id: true },
      });
      const npsIdsArray = npsIds.map((n) => n.id);

      // Se não houver NPS, retornar valores zerados
      if (npsIdsArray.length === 0) {
        return {
          scoreGeral: 0,
          npsPorCanal: [],
          npsPorFila: [],
          npsPorSetor: [],
          evolucaoTemporal: [],
        };
      }

      // Construir where para respostas incluindo filtro de nps_id
      const whereCompleto = {
        ...where,
        nps_id: { in: npsIdsArray },
      };

      const respostas = await this.prisma.npsResposta.findMany({
        where: whereCompleto,
        include: {
          nps: true,
        },
      });

      const respostasFiltradas = respostas.filter((r) => r.nps !== null);

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

