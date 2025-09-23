import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MicroserviceTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-microservice-token'];

    console.log('request', request);

    const token_valid = this.jwtService.verify(token);

    if (!token_valid) {
      throw new UnauthorizedException('Token do microserviço inválido');
    }

    const decodedToken = this.jwtService.decode(token);

    console.log('decodedToken', decodedToken);

    // preciso pegar o body da requisição
    const key = request.body.key;
    
    if (key) return true;

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
