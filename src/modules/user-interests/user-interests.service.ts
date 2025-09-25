import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInterest } from './entities/user-interest.entity';
import { CreateUserInterestDto } from './dto/create-user-interest.dto';
import { UpdateUserInterestDto } from './dto/update-user-interest.dto';

@Injectable()
export class UserInterestsService {
  constructor(
    @InjectRepository(UserInterest)
    private readonly repository: Repository<UserInterest>,
  ) {}

  create(createUserInterestDto: CreateUserInterestDto) {
    return 'This action adds a new userInterest';
  }

  async findAll() {
    const interests = await this.repository.find();
    return { code: 1, message: 'User interests retrieved successfully', data: interests };
  }

  findOne(id: string) {
    return `This action returns a #${id} userInterest`;
  }

  update(id: string, updateUserInterestDto: UpdateUserInterestDto) {
    return `This action updates a #${id} userInterest`;
  }

  remove(id: string) {
    return `This action removes a #${id} userInterest`;
  }
}