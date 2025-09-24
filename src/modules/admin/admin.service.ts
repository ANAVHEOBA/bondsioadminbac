import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { AdminLoginDto } from './dto/admin-login/admin-login';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async validateAdmin(loginDto: AdminLoginDto): Promise<Admin | null> {
    const { email, password } = loginDto;

    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      return null;
    }

    const isPasswordValid = await admin.validatePassword(password);
    
    if (!isPasswordValid) {
      return null;
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Update last login time
    admin.lastLoginAt = new Date();
    await this.adminRepository.save(admin);

    return admin;
  }

  async login(admin: Admin) {
    const payload = { 
      email: admin.email, 
      sub: admin.id, 
      role: admin.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async findById(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async createSuperAdmin(): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({ 
      where: { email: 'admin@bondsio.com' } 
    });

    if (existingAdmin) {
      return existingAdmin;
    }

    const superAdmin = this.adminRepository.create({
      email: 'admin@bondsio.com',
      password: 'Admin@123', // Change this in production
      role: 'super_admin',
      isActive: true,
    });

    return this.adminRepository.save(superAdmin);
  }
}