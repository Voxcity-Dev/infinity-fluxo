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
    promotores: number;
    neutros: number;
    detratores: number;
    percentualPromotores: number;
    percentualNeutros: number;
    percentualDetratores: number;
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
          promotores: 0,
          neutros: 0,
          detratores: 0,
          percentualPromotores: 0,
          percentualNeutros: 0,
          percentualDetratores: 0,
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
      // Neutros: 7-8
      const promotores = respostasFiltradas.filter((r) => r.resposta >= 9).length;
      const neutros = respostasFiltradas.filter((r) => r.resposta >= 7 && r.resposta <= 8).length;
      const detratores = respostasFiltradas.filter((r) => r.resposta <= 6).length;
      
      const percentualPromotores = totalRespostas > 0 ? (promotores / totalRespostas) * 100 : 0;
      const percentualNeutros = totalRespostas > 0 ? (neutros / totalRespostas) * 100 : 0;
      const percentualDetratores = totalRespostas > 0 ? (detratores / totalRespostas) * 100 : 0;
      const scoreNPS = percentualPromotores - percentualDetratores;

      // Taxa de resposta (será calculada com base em tickets que receberam NPS)
      // Por enquanto, se temos respostas, consideramos que foram enviados
      // Isso pode ser melhorado depois com dados da mensageria
      const taxaResposta = totalRespostas > 0 ? 100 : 0;

      return {
        totalNps,
        totalRespostas,
        taxaResposta,
        scoreNPS: Math.round(scoreNPS * 100) / 100,
        promotores,
        neutros,
        detratores,
        percentualPromotores: Math.round(percentualPromotores * 100) / 100,
        percentualNeutros: Math.round(percentualNeutros * 100) / 100,
        percentualDetratores: Math.round(percentualDetratores * 100) / 100,
        distribuicao,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métricas NPS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém métricas CSAT (Customer Satisfaction)
   * Usa dados NPS como base, convertendo escala 0-10 para 1-5 estrelas
   */
  async getCsatMetrics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    scoreCSAT: number; // Média de 1-5 estrelas
    totalRespostas: number;
    distribuicao: Array<{ nota: number; quantidade: number; percentual: number }>;
    historico: Array<{ periodo: string; valor: number; respostas: number }>;
  }> {
    try {
      this.logger.log(`Obtendo métricas CSAT${tenantId ? ` para tenant: ${tenantId}` : ''}`);

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

      // Buscar IDs dos NPS válidos
      const npsIds = await this.prisma.nps.findMany({
        where: whereNps,
        select: { id: true, tenant_id: true },
      });
      const npsIdsArray = npsIds.map((n) => n.id);

      if (npsIdsArray.length === 0) {
        return {
          scoreCSAT: 0,
          totalRespostas: 0,
          distribuicao: Array.from({ length: 5 }, (_, i) => ({
            nota: i + 1,
            quantidade: 0,
            percentual: 0,
          })),
          historico: [],
        };
      }

      // Buscar respostas NPS
      const whereRespostaCompleto = {
        ...whereResposta,
        nps_id: { in: npsIdsArray },
      };

      const respostas = await this.prisma.npsResposta.findMany({
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
        orderBy: {
          created_at: 'asc',
        },
      });

      // Filtrar respostas válidas
      const respostasFiltradas = respostas.filter((r) => {
        if (!r.nps || r.nps.is_deleted) return false;
        if (tenantId && r.nps.tenant_id !== tenantId) return false;
        return true;
      });

      const totalRespostas = respostasFiltradas.length;

      if (totalRespostas === 0) {
        return {
          scoreCSAT: 0,
          totalRespostas: 0,
          distribuicao: Array.from({ length: 5 }, (_, i) => ({
            nota: i + 1,
            quantidade: 0,
            percentual: 0,
          })),
          historico: [],
        };
      }

      // Converter NPS (0-10) para CSAT (1-5 estrelas)
      // Mapeamento: 0-1 -> 1, 2-3 -> 2, 4-5 -> 3, 6-7 -> 4, 8-10 -> 5
      const csatNotas = respostasFiltradas.map((r) => {
        const notaNPS = r.resposta;
        if (notaNPS <= 1) return 1;
        if (notaNPS <= 3) return 2;
        if (notaNPS <= 5) return 3;
        if (notaNPS <= 7) return 4;
        return 5;
      });

      // Calcular score CSAT (média)
      const scoreCSAT = csatNotas.reduce((sum, nota) => sum + nota, 0) / totalRespostas;

      // Distribuição por nota CSAT (1-5)
      const distribuicaoMap = new Map<number, number>();
      for (let i = 1; i <= 5; i++) {
        distribuicaoMap.set(i, 0);
      }

      csatNotas.forEach((nota) => {
        distribuicaoMap.set(nota, (distribuicaoMap.get(nota) || 0) + 1);
      });

      const distribuicao = Array.from(distribuicaoMap.entries()).map(([nota, quantidade]) => ({
        nota,
        quantidade,
        percentual: totalRespostas > 0 ? (quantidade / totalRespostas) * 100 : 0,
      }));

      // Histórico temporal (agrupar por dia)
      const historicoMap = new Map<string, { soma: number; count: number }>();

      respostasFiltradas.forEach((r) => {
        const data = r.created_at.toISOString().split('T')[0];
        const notaCSAT = csatNotas[respostasFiltradas.indexOf(r)];

        if (!historicoMap.has(data)) {
          historicoMap.set(data, { soma: 0, count: 0 });
        }

        const entry = historicoMap.get(data)!;
        entry.soma += notaCSAT;
        entry.count += 1;
      });

      const historico = Array.from(historicoMap.entries())
        .map(([periodo, data]) => ({
          periodo,
          valor: data.count > 0 ? data.soma / data.count : 0,
          respostas: data.count,
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));

      return {
        scoreCSAT: Math.round(scoreCSAT * 100) / 100,
        totalRespostas,
        distribuicao,
        historico,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métricas CSAT: ${error.message}`);
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

      // ========== Calcular NPS por Fila ==========
      // Buscar vínculos NPS-Fila
      const whereNpsFila: any = { is_deleted: false };
      if (tenantId) {
        whereNpsFila.tenant_id = tenantId;
      }
      if (npsId) {
        whereNpsFila.nps_id = npsId;
      } else {
        // Se não foi especificado npsId, filtrar apenas pelos NPS válidos
        whereNpsFila.nps_id = { in: npsIdsArray };
      }

      const npsFilas = await this.prisma.npsFila.findMany({
        where: whereNpsFila,
        select: {
          fila_atendimento_id: true,
          nps_id: true,
        },
      });

      // Criar mapa: filaId -> npsIds[]
      const filaNpsMap = new Map<string, string[]>();
      npsFilas.forEach((npsFila) => {
        const filaId = npsFila.fila_atendimento_id;
        if (!filaNpsMap.has(filaId)) {
          filaNpsMap.set(filaId, []);
        }
        filaNpsMap.get(filaId)!.push(npsFila.nps_id);
      });

      // Calcular NPS por fila
      const npsPorFila: Array<{ filaId?: string; nome: string; score: number; totalRespostas: number }> = [];

      for (const [filaId, npsIdsDaFila] of filaNpsMap.entries()) {
        // Filtrar respostas que pertencem aos NPS desta fila
        const respostasDaFila = respostasFiltradas.filter((r) =>
          npsIdsDaFila.includes(r.nps_id)
        );

        if (respostasDaFila.length === 0) {
          continue;
        }

        // Calcular score NPS para esta fila
        const promotoresFila = respostasDaFila.filter((r) => r.resposta >= 9).length;
        const detratoresFila = respostasDaFila.filter((r) => r.resposta <= 6).length;
        const totalRespostas = respostasDaFila.length;
        const percentualPromotoresFila = totalRespostas > 0 ? (promotoresFila / totalRespostas) * 100 : 0;
        const percentualDetratoresFila = totalRespostas > 0 ? (detratoresFila / totalRespostas) * 100 : 0;
        const scoreFila = percentualPromotoresFila - percentualDetratoresFila;

        npsPorFila.push({
          filaId,
          nome: `Fila ${filaId}`, // Placeholder - frontend fará match com dados de filas
          score: Math.round(scoreFila * 100) / 100,
          totalRespostas,
        });
      }

      // Ordenar por total de respostas (maior primeiro)
      npsPorFila.sort((a, b) => b.totalRespostas - a.totalRespostas);

      return {
        scoreGeral: Math.round(scoreGeral * 100) / 100,
        npsPorCanal: [],
        npsPorFila,
        npsPorSetor: [],
        evolucaoTemporal: [],
      };
    } catch (error) {
      this.logger.error(`Erro ao obter análise NPS: ${error.message}`);
      throw error;
    }
  }
}

