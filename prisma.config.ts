import 'dotenv/config';
import type { PrismaConfig } from 'prisma';

export default {
	schema: 'prisma/schema',
	migrations: {
		path: 'prisma/migrations',
		// seed: 'ts-node prisma/seed/run.ts',
	},
} as PrismaConfig;
