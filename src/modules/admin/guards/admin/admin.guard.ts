import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../../admin.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        throw new UnauthorizedException('Insufficient permissions');
      }

      const admin = await this.adminService.findById(payload.sub);
      
      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is deactivated');
      }

      request.admin = admin;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}