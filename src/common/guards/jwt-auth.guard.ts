// src/common/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can override methods here if needed
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
   console.log('JWT Authorization Header:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error('JWT Guard Error:', err || info);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
