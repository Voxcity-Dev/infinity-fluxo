import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class MicroserviceTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-microservice-token'];
    
    const cookie = this.extractTokenFromHeader(request);

    console.log('cookie', cookie);
    console.log('token', token);


    // CASO SEJA O FRONTEND ACESSANDO O MICROSERVICO
    if (cookie) {
      const payload = this.jwtService.verify(cookie as string, {secret: process.env.JWT_ACCESS_SECRET});

      if (payload.key !== process.env.KEY ) {
        console.log('key not found');
        throw new UnauthorizedException('Key do microserviço inválida');
      }
      
      request['micro'] = payload;

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
