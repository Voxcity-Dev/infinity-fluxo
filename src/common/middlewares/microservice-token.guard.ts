import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class MicroserviceTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Garante que body exista em requisições sem corpo (ex.: GET/DELETE)
    if (!request.body || typeof request.body !== 'object') {
      (request as any).body = {};
    }
    const token = request.headers['x-microservice-token'];
    const cookie = this.extractTokenFromHeader(request);

    console.log('cookie', cookie);
    console.log('token', token);

    // CASO SEJA O FRONTEND ACESSANDO O MICROSERVICO
    if (cookie) {
      const payload = this.jwtService.verify(cookie as string, {secret: process.env.JWT_ACCESS_SECRET});

      console.log('payload', payload);

      if (payload.key !== process.env.KEY ) {
        console.log('key not found');
        throw new UnauthorizedException('Key do microserviço inválida');
      }

      request['micro'] = payload;
      // Disponibiliza tenant_id também direto na request para rotas que não usam body
      if (payload.tenant_id) {
        request['tenant_id'] = payload.tenant_id;
      }

      // Injetar tenant_id no body e request para fácil acesso
      if (payload.tenant_id) {
        (request as any).body = (request as any).body || {};
        request.body.tenant_id = payload.tenant_id;
      }

      return true;

    }

    // CASO SEJA O MICROSERVICO ACESSANDO O MICROSERVICO
    if (!token) {
      console.log('token not found');
      throw new UnauthorizedException('Token do microserviço não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token as string);

      if (payload.key !== process.env.KEY ) {
        console.log('key not found');
        throw new UnauthorizedException('Key do microserviço inválida');
      }
      
      request['micro'] = payload;
      if (payload.tenant_id) {
        request['tenant_id'] = payload.tenant_id;
      }

      // Injetar tenant_id no body se não existir
      if (payload.tenant_id && !request.body.tenant_id) {
        (request as any).body = (request as any).body || {};
        request.body.tenant_id = payload.tenant_id;
      }

      return true;

    } catch (error) {
      console.log('error');
      console.log(error);
      throw new UnauthorizedException('Token do microserviço inválido');
    }

  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
