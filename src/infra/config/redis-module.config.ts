import type { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { Logger } from '@nestjs/common';

const logger = new Logger('Redis');

export const RedisModuleConfig: RedisModuleOptions = {
	config: {
		url: process.env.REDIS_URL || 'redis://localhost:6379',
		db: Number(process.env.REDIS_DB) || 0,
		onClientCreated: client => {
			client.on('error', error => {
				logger.error('❌ Redis error', error);
			});
			client.on('connect', () => {
				logger.log('✅ Redis connected');
			});
			client.on('ready', () => {
				logger.log('✅ Redis ready');
			});
		},
	},
};
