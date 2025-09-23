import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MicroserviceTokenGuard } from '../middlewares/microservice-token.guard';

@Module({
	imports: [
		JwtModule.register({
			secret: process.env.MICROSERVICE_TOKEN || 'dev-secret-key',
			signOptions: { expiresIn: '1h' },
		}),
	],
	providers: [MicroserviceTokenGuard],
	exports: [MicroserviceTokenGuard, JwtModule],
})
export class MicroserviceTokenModule {}
