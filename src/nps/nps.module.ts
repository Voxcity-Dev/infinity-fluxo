import { Logger, Module } from '@nestjs/common';
import { NpsController } from './nps.controller';
import { NpsService } from './nps.service';
import { PrismaModule } from 'src/infra/database/prisma/prisma.module';
@Module({
	imports: [PrismaModule],
	controllers: [NpsController],
	providers: [NpsService, Logger],
	exports: [NpsService],
})
export class NpsModule {}
