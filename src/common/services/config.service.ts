// src/common/services/config.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CondicaoRegra } from 'src/schemas/condicao.schema';

@Injectable()
export class ConfigService {
    constructor(private readonly prisma: PrismaService) {}

    readonly configuracaoDefaults = {
        ENVIA_MENSAGEM: 'Seu atendimento foi encaminhado para a fila! Mensagem padrão.',
        MENSAGEM_INVALIDA: 'Desculpe, não entendi sua resposta. Poderia repetir?',
        TEMPO_MAXIMO: 'NONE',
        FILA_PADRAO: '',
        USUARIO_PADRAO: '',
        MAXIMO_TENTATIVAS: '3',
        DISTRIBUICAO_AUTOMATICA: 'NONE',
        ENCERRAR_FLUXO_CONDIÇÃO: 'encerrar'
    } as const;

    async getInvalidResponseMessage(etapa_id: string) {
        try {
            const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
                where: { 
                    fluxo: { etapas: { some: { id: etapa_id } } },
                    chave: 'MENSAGEM_INVALIDA' 
                },
            });

            return configuracao?.valor || this.configuracaoDefaults.MENSAGEM_INVALIDA;
        } catch (error) {
            console.error('Erro ao obter mensagem de resposta inválida:', error);
            return this.configuracaoDefaults.MENSAGEM_INVALIDA;
        }
    }

    async getSendMessage(fluxo_id: string) {
        const configuracao = await this.prisma.fluxoConfiguracao.findFirst({
            where: { fluxo_id, chave: 'ENVIA_MENSAGEM' },
        });
        return configuracao?.valor || this.configuracaoDefaults.ENVIA_MENSAGEM;
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
            },
            // SETAR_VARIAVEL: 'SETAR_VARIAVEL',
            // OBTER_VARIAVEL: 'OBTER_VARIAVEL',
            // API: 'API',
            // DB: 'DB',
        } as const;

        return acao[regra.action]
    }
}
