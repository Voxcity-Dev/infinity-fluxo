import { Injectable, PipeTransform } from '@nestjs/common';
import type { ZodObject } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
	constructor(private readonly schema: ZodObject) {}

	transform(value: any) {
		this.schema.parse(value);
		return value;
	}
}
