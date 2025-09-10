import type { PrismaConfig } from 'prisma';

process.loadEnvFile();

export default {
	schema: 'prisma/schema',
	migrations: {
		path: 'prisma/migrations',
		seed: 'ts-node prisma/seed/run.ts',
	},
} as PrismaConfig;
