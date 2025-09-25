import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class MicroserviceTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-microservice-token'];

    // console.log('headers');
    // 
    // console.log('token');
    // console.log(token);
    
    console.log('token', token);
    console.log('process.env.KEY', process.env.KEY);
    console.log('process.env.MICROSERVICE_TOKEN', process.env.MICROSERVICE_TOKEN);
    console.log(request.headers);


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
}
