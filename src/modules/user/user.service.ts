import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, Like, FindManyOptions, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { User } from './entities/user.entity';
import { Country } from './entities/country.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';

// Export the interface so controller can use it
export interface AnalyticsData {
  label: string;
  count: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Country) private readonly countryRepository: Repository<Country>,
  ) {}

  async findAll(query: FindAllUsersDto) {
    const { page = 1, limit = 10, search, email_verified, phone_verified, notification } = query;
  
    const whereConditions: any = {};
    if (email_verified !== undefined) whereConditions.email_verified = email_verified;
    if (phone_verified !== undefined) whereConditions.phone_verified = phone_verified;
    if (notification !== undefined) whereConditions.notification = notification;
  
    const options: FindManyOptions<User> = {
      relations: ['country'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      where: whereConditions,
    };
  
    if (search?.trim()) {
      options.where = [
        { ...whereConditions, full_name: Like(`%${search.trim()}%`) },
        { ...whereConditions, user_name: Like(`%${search.trim()}%`) },
        { ...whereConditions, email: Like(`%${search.trim()}%`) },
      ];
    }
  
    const [users, total] = await this.userRepository.findAndCount(options);
    const transformedUsers = users.map(user => this.toUserResponseDto(user));
  
    const totalPages = Math.ceil(total / limit);
  
    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, includeFollowStats = false, viewerId?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['country'],
    });
    
    if (!user) throw new BadRequestException('User not found');

    let userResponse = this.toUserResponseDto(user, includeFollowStats);

    // Add is_following status if viewerId is provided
    if (viewerId && viewerId !== id) {
      // For now, set to false - you can implement actual follow logic later
      userResponse.is_following = false;
    } else {
      userResponse.is_following = false; // self lookup → not applicable
    }

    return userResponse;
  }

  async findMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['country'],
    });

    if (!user) throw new BadRequestException('User not found');

    // Get user stats
    let followersCount = 0, followingCount = 0, bondsCount = 0, activitiesCount = 0;

    // For now, use simplified stats - you can implement real stats later
    followersCount = Math.floor(Math.random() * 1000); // Placeholder
    followingCount = Math.floor(Math.random() * 500);  // Placeholder
    bondsCount = Math.floor(Math.random() * 50);       // Placeholder
    activitiesCount = Math.floor(Math.random() * 100); // Placeholder

    const userResponse = this.toUserResponseDto(user);
    
    return {
      ...userResponse,
      followers_count: followersCount,
      following_count: followingCount,
      bonds_count: bondsCount,
      activities_count: activitiesCount,
    };
  }

  async remove(id: string) {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException('User not found');
    }
    return { 
      statusCode: 200,
      message: 'User deleted successfully',
      data: {}
    };
  }

  async getTotalUsers(): Promise<number> {
    return this.userRepository.count();
  }

  async getUsersOverview(params: { period: 'daily'|'weekly'|'monthly' }) {
    const { period } = params;
    const now = new Date();
    const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
    
    const signUps: AnalyticsData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'daily') {
        date.setDate(now.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const count = await this.userRepository.count({
          where: {
            created_at: Between(startOfDay, endOfDay)
          }
        });
        signUps.push({ label: date.toISOString().slice(0, 10), count });
      } else if (period === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const count = await this.userRepository.count({
          where: {
            created_at: Between(weekStart, weekEnd)
          }
        });
        signUps.push({ label: `Week ${Math.ceil((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`, count });
      } else { // monthly
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const count = await this.userRepository.count({
          where: {
            created_at: Between(monthStart, monthEnd)
          }
        });
        signUps.push({ label: monthStart.toISOString().slice(0, 7), count });
      }
    }

    // Generate active users (simplified - 80% of signups)
    const active = signUps.map(item => ({ 
      ...item, 
      count: Math.floor(item.count * 0.8) 
    }));

    // Generate churned users (simplified - 10% of signups)
    const churned = signUps.map(item => ({ 
      ...item, 
      count: Math.floor(item.count * 0.1) 
    }));

    return { signUps, active, churned };
  }

  async getUsersDemography() {
    // Age distribution
    const ageResult = await this.userRepository
      .createQueryBuilder('u')
      .select(`
        CASE
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) <= 18 THEN '≤18'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 25 THEN '19-25'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 26 AND 35 THEN '26-35'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 36 AND 45 THEN '36-45'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END
      `, 'bucket')
      .addSelect('COUNT(*)', 'count')
      .where('u.dob IS NOT NULL')
      .groupBy('bucket')
      .orderBy('bucket')
      .getRawMany();

    // Gender distribution
    const genderResult = await this.userRepository
      .createQueryBuilder('u')
      .select("COALESCE(u.gender, 'unknown')", 'gender')
      .addSelect('COUNT(*)', 'count')
      .groupBy('gender')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Country distribution
    const countryResult = await this.userRepository
      .createQueryBuilder('u')
      .leftJoin('countries', 'c', 'c.id = u.country_id')
      .select('c.name', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('c.name IS NOT NULL')
      .andWhere('c.name != ""')
      .groupBy('c.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      age: ageResult,
      gender: genderResult,
      countries: countryResult,
    };
  }

  async getVerificationFunnel() {
    const total = await this.userRepository.count();
    const emailVerified = await this.userRepository.count({ where: { email_verified: true } });
    const phoneVerified = await this.userRepository.count({ where: { phone_verified: true } });
    const bothVerified = await this.userRepository.count({ where: { email_verified: true, phone_verified: true } });

    return {
      total,
      email_verified: { count: emailVerified, percentage: Math.round((emailVerified / total) * 100) },
      phone_verified: { count: phoneVerified, percentage: Math.round((phoneVerified / total) * 100) },
      both_verified: { count: bothVerified, percentage: Math.round((bothVerified / total) * 100) },
    };
  }

  private toUserResponseDto(user: User, includeStats = false): UserResponseDto {
    const transformed = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    // Handle country data properly
    if (user.country) {
      transformed.country = {
        id: user.country.id,
        name: user.country.name,
      };
    }

    if (includeStats) {
      // Add basic stats - you can expand this with real data
      transformed.followers_count = Math.floor(Math.random() * 1000);
      transformed.following_count = Math.floor(Math.random() * 500);
      transformed.bonds_count = Math.floor(Math.random() * 50);
      transformed.activities_count = Math.floor(Math.random() * 100);
    }

    return transformed;
  }

  // Additional helper methods for future expansion

  async getUserStats(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    return {
      followers_count: Math.floor(Math.random() * 1000),
      following_count: Math.floor(Math.random() * 500),
      bonds_count: Math.floor(Math.random() * 50),
      activities_count: Math.floor(Math.random() * 100),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { user_name: username } });
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { 
      // Add last_login field if you have it in your entity
    });
  }

  async getUsersByCountry(countryId: number): Promise<User[]> {
    return this.userRepository.find({ 
      where: { country_id: countryId },
      relations: ['country'] 
    });
  }

  async getActiveUsersCount(): Promise<number> {
    // You can define what "active" means - here we use email_verified as a proxy
    return this.userRepository.count({ where: { email_verified: true } });
  }

  async getNewUsersCount(days: number = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.userRepository.count({
      where: {
        created_at: Between(date, new Date())
      }
    });
  }
}