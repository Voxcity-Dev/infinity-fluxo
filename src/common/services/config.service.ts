// src/common/services/config.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CondicaoRegra } from 'src/schemas/condicao.schema';
import { api_core } from 'src/infra/config/axios/core';

@Injectable()
export class ConfigService {
    constructor(private readonly prisma: PrismaService) {}

    // TODO: Quando implementar variáveis de ambiente, considerar usar:
    // MENSAGEM_INVALIDA_DEFAULT, MENSAGEM_FINALIZACAO_DEFAULT, etc.
    readonly configuracaoDefaults = {
        ENVIA_MENSAGEM: 'Seu atendimento foi encaminhado para a fila!',
        MENSAGEM_INVALIDA: 'Desculpe, não entendi sua resposta. Poderia repetir?',
        TEMPO_MAXIMO: 'NONE',
        FILA_PADRAO: '',
        USUARIO_PADRAO: '',
        MAXIMO_TENTATIVAS: '3',
        DISTRIBUICAO_AUTOMATICA: 'NONE',
        ENCERRAR_FLUXO_CONDIÇÃO: 'encerrar',
        MENSAGEM_FINALIZACAO: 'Seu atendimento foi encerrado!',
        MENSAGEM_FORA_HORARIO: 'No momento estamos fora do horário de atendimento. Por favor, tente novamente mais tarde.',
        EXPIRACAO_TRIAGEM_HABILITADA: 'false',
        EXPIRACAO_TRIAGEM_MINUTOS: '30',
        EXPIRACAO_TRIAGEM_MENSAGEM: 'Seu atendimento expirou por inatividade.',
        EXPIRACAO_NPS_HABILITADA: 'false',
        EXPIRACAO_NPS_HORAS: '24',
        EXPIRACAO_NPS_MENSAGEM: '',
        EXPIRACAO_NPS_SILENCIOSO: 'true',
    } as const;

    async getInvalidResponseMessage(etapa_id: string) {
        try {
            const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
                where: { 
                    fluxo: { etapas: { some: { id: etapa_id } } },
                    chave: 'MENSAGEM_INVALIDA' 
                },
            });

            // TODO: Incrementar com variáveis de ambiente:
            // return configuracao?.valor || process.env.MENSAGEM_INVALIDA_DEFAULT || this.configuracaoDefaults.MENSAGEM_INVALIDA;
            return configuracao?.valor || this.configuracaoDefaults.MENSAGEM_INVALIDA;
        } catch (error) {
            console.error('Erro ao obter mensagem de resposta inválida:', error);
            // TODO: Incrementar com variáveis de ambiente:
            // return process.env.MENSAGEM_INVALIDA_DEFAULT || this.configuracaoDefaults.MENSAGEM_INVALIDA;
            return this.configuracaoDefaults.MENSAGEM_INVALIDA;
        }
    }

    async getSendMessageDefault(fluxo_id: string) {
        const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
            where: { fluxo_id, chave: 'ENVIA_MENSAGEM' },
        });
        return configuracao?.valor || this.configuracaoDefaults.ENVIA_MENSAGEM;
    }

    async getSendMessageQueue(queue_id: string) {
        try {
            const configuracao = await api_core.get(`/fila/${queue_id}/mensagem-encaminhar`);
            return configuracao.data;
            
        } catch (error) {
            return this.configuracaoDefaults.ENVIA_MENSAGEM;
        }

    }

    async getSendMessageOutOfHour(queue_id: string) {
        try {
            const configuracao = await api_core.get(`/fila/${queue_id}/mensagem-fora-horario`);
            return configuracao.data;
        } catch (error) {
            console.error('Erro ao obter mensagem de resposta fora do horário:', error);
            return this.configuracaoDefaults.MENSAGEM_FORA_HORARIO;
        }
    }

    async verificarRegra(regra: CondicaoRegra) {
        const acao = {
            ETAPA: {
                next_etapa_id: regra.next_etapa_id,
            },
            FLUXO: {
                next_fluxo_id: regra.next_fluxo_id,
            },
            FILA: {
                queue_id: regra.queue_id,
            },
            USUARIO: {
                user_id: regra.user_id,
                queue_id: regra.queue_id,
            },
            // SETAR_VARIAVEL: 'SETAR_VARIAVEL',
            // OBTER_VARIAVEL: 'OBTER_VARIAVEL',
            // API: 'API',
            // DB: 'DB',
        } as const;

        return acao[regra.action]
    }
}
