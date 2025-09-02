import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
	@Get()
	@ApiOperation({ summary: 'Verifica se a aplicação está funcionando' })
	@ApiResponse({
		status: 200,
		description: 'Aplicação funcionando corretamente',
		schema: {
			type: 'string',
			example: 'Yes, this is working.',
		},
	})
	getHello(): string {
		return 'Yes, this is working.';
	}
}
