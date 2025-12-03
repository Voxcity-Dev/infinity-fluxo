import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
		super({ adapter });
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.$connect();
			this.logger.log('✅ Conexão com banco de dados estabelecida!');
		} catch (error) {
			this.logger.error('❌ Erro ao conectar com o banco de dados:', error);
			throw error;
		}
	}

	async onModuleDestroy(): Promise<void> {
		try {
			await this.$disconnect();
			this.logger.log('🔌 Conexão com banco de dados encerrada!');
		} catch (error) {
			this.logger.error('❌ Erro ao encerrar conexão com o banco de dados', error);
			throw error;
		}
	}
}
