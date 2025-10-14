import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodObject } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
	constructor(private readonly schema: ZodObject) {}

	transform(value: any) {
		const result = this.schema.safeParse(value);
		if (!result.success) {
			const errors = result.error.errors.map((err) => ({
				path: err.path.join('.'),
				message: err.message,
			}));
			throw new BadRequestException({
				message: 'Erro de validação',
				errors,
			});
		}
		return result.data;
	}
}
