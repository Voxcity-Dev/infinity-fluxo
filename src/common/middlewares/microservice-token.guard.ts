import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class MicroserviceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-microservice-token'];

    console.log('cookie', request.cookies);

    if (!token) {
      console.log('Token do microserviço não fornecido');
      throw new UnauthorizedException('Token do microserviço não fornecido');
    }

    // Verifica se o token é válido comparando com a variável de ambiente
    const expectedToken = process.env.MICROSERVICE_TOKEN;
    
    if (!expectedToken) {
      throw new UnauthorizedException('Token do microserviço não configurado');
    }

    if (token !== expectedToken) {
      throw new UnauthorizedException('Token do microserviço inválido');
    }

    return true;
  }
}
