import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError, z } from 'zod';

@Catch(ZodError)
export class ZodFilter<T extends ZodError> implements ExceptionFilter {
	catch(exception: T, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const status = 400;

		const errors = z.flattenError(exception);

		console.log('erros de validacao zod', JSON.stringify(errors, null, 2));

		response.status(status).json({
			success: false,
			errors,
			statusCode: status,
		});
	}
}
