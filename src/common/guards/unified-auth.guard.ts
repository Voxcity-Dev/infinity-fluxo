import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const microserviceToken = this.extractMicroserviceToken(request);
		if (microserviceToken) {
			return this.validateMicroserviceToken(request, microserviceToken);
		}

		const userToken = this.extractUserToken(request);
		if (userToken) {
			return this.validateUserToken(request, userToken);
		}

		throw new UnauthorizedException('Token não fornecido');
	}

	private extractMicroserviceToken(request: Request): string | undefined {
		return request.headers['x-microservice-token'] as string | undefined;
	}

	private extractUserToken(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}

	private validateMicroserviceToken(request: Request, token: string): boolean {
		if (!request.body || typeof request.body !== 'object') {
			(request as any).body = {};
		}

		try {
			const payload = this.jwtService.verify(token, {
				secret: process.env.MICROSERVICE_TOKEN || 'dev-secret-key',
			});

			if (payload.key !== process.env.JWT_KEY) {
				throw new UnauthorizedException('Key do microserviço inválida');
			}

			request['micro'] = payload;
			if (payload.tenant_id) {
				request['tenant_id'] = payload.tenant_id;
			}

			if (payload.tenant_id && !request.body.tenant_id) {
				(request as any).body = (request as any).body || {};
				request.body.tenant_id = payload.tenant_id;
			}

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Token do microserviço inválido');
		}
	}

	private async validateUserToken(request: Request, token: string): Promise<boolean> {
		try {
			const secret =
				process.env.JWT_ACCESS_SECRET || process.env.MICROSERVICE_TOKEN || 'dev-secret-key';

			const payload = await this.jwtService.verifyAsync(token, {
				secret,
			});

			request['user'] = payload;

			return true;
		} catch {
			throw new UnauthorizedException('Token inválido');
		}
	}
}
