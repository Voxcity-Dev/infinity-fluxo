import { CreateLog } from './../../schemas/log.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class LogService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateLog) {
        try {
            await this.prisma.logs.create({
                data: {
                    tenant_id: data.tenant_id,
                    ticket_id: data.ticket_id,
                    fluxo_id: data.fluxo_id,
                    etapa_id: data.etapa_id,
                    opcao_id: data.opcao_id || null,
                },
            });
        } catch (error) {
            console.error('Erro ao criar log:', error);
            throw new BadRequestException('Erro ao criar log');
        }
    }
}