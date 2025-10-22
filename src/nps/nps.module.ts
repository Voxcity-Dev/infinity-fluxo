import { Module } from '@nestjs/common';
import { NpsController } from './nps.controller';
import { NpsService } from './nps.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
import { MicroserviceTokenModule } from 'src/common/guards/microservice-token.module';

@Module({
	imports: [PrismaModule, MicroserviceTokenModule],
	controllers: [NpsController],
	providers: [NpsService],
	exports: [NpsService],
})
export class NpsModule {}
