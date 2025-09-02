import { CallHandler, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type WithMessage<T = unknown> = {
	message: string;
	data?: T;
};

function hasMessage<T = unknown>(value: unknown): value is WithMessage<T> {
	return !!value && typeof value === 'object' && 'message' in value;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
	intercept(_, next: CallHandler<T>): Observable<any> {
		return next.handle().pipe(
			map(data => {
				if (hasMessage(data)) {
					// usa a mensagem que veio no retorno
					return {
						success: true,
						message: data.message,
						data: data.data ?? null,
					};
				}

				// caso não tenha mensagem, usa padrão
				return {
					success: true,
					message: 'Operação realizada com sucesso',
					data: data || null,
				};
			}),
		);
	}
}
