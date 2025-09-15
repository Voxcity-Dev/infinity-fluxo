import { Injectable, PipeTransform } from '@nestjs/common';
import type { ZodObject } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
	constructor(private readonly schema: ZodObject) {}

	transform(value: any) {
		const result = this.schema.safeParse(value);
		if (!result.success) {
			throw new Error('Validation failed');
		}
		return result.data;
	}
}
