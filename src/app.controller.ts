import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipAuth } from './common/decorators/skip-auth.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Verifica se a aplicacao esta funcionando' })
  @ApiResponse({
    status: 200,
    description: 'Aplicacao funcionando corretamente',
    schema: {
      type: 'string',
      example: 'Yes, this is working.',
    },
  })
  getHello(): string {
    return 'Yes, this is working.';
  }

  @Get('health')
  @SkipAuth()
  @ApiOperation({ summary: 'Health check da aplicacao' })
  @ApiResponse({
    status: 200,
    description: 'Status da aplicacao',
  })
  getHealth() {
    return {
      service: 'infinity-fluxo',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
