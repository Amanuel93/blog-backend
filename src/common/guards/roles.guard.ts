// src/common/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('Required Roles:', requiredRoles); // <-- debug log
    if (!requiredRoles) {
      return true; // no roles required, allow access
    }
    const { user } = context.switchToHttp().getRequest();
    console.log('User from JWT:', user);
    return requiredRoles.includes(user.role);
  }
}
