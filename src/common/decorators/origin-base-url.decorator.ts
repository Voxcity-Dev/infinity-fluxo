import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const OriginBaseUrl = createParamDecorator((_, ctx: ExecutionContext): string => {
	const request: Request = ctx.switchToHttp().getRequest();
	const { protocol } = request;
	const host = request.get('host');

	return `${protocol}://${host}`;
});
