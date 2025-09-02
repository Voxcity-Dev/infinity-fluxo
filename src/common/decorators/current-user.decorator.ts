import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from 'src/types/user.type';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext): User | undefined => {
	const request = ctx.switchToHttp().getRequest();

	return request?.user as User | undefined;
});
