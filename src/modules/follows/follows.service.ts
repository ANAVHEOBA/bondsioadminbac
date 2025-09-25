import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UnfollowDto } from './dto/unfollow.dto';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /* ---------------------------------------------------- */
  /*  ADMIN / READ-ONLY  –  no Response helper used       */
  /* ---------------------------------------------------- */

  async getFollowers(userId: string) {
    const rows = await this.followRepository
      .createQueryBuilder('follow')
      .innerJoin('follow.follower', 'user')
      .select([
        'user.id          AS id',
        'user.full_name   AS full_name',
        'user.user_name   AS user_name',
        'user.email       AS email',
        'user.profile_image AS profile_image',
        'user.bio         AS bio',
        'user.created_at  AS created_at',
      ])
      .where('follow.following_id = :userId', { userId })
      .getRawMany();

    return { code: 1, message: 'Followers retrieved successfully', data: rows };
  }

  async getFollowing(userId: string) {
    const rows = await this.followRepository
      .createQueryBuilder('follow')
      .innerJoin('follow.following', 'user')
      .select([
        'user.id          AS id',
        'user.full_name   AS full_name',
        'user.user_name   AS user_name',
        'user.email       AS email',
        'user.profile_image AS profile_image',
        'user.bio         AS bio',
        'user.created_at  AS created_at',
      ])
      .where('follow.follower_id = :userId', { userId })
      .getRawMany();

    return { code: 1, message: 'Following list retrieved successfully', data: rows };
  }

  async getFollowStats(userId: string) {
    const followersCount = await this.followRepository.count({
      where: { following: { id: userId } },
    });

    const followingCount = await this.followRepository.count({
      where: { follower: { id: userId } },
    });

    return {
      code: 1,
      message: 'Follow stats retrieved successfully',
      data: { followers_count: followersCount, following_count: followingCount },
    };
  }

  /* ---------------------------------------------------- */
  /*  OPTIONAL – keep if you still need the mutations     */
  /* ---------------------------------------------------- */

  async followUser(userId: string, createFollowDto: CreateFollowDto) {
    if (userId === createFollowDto.following_id) {
      throw new ConflictException('You cannot follow yourself');
    }

    const userToFollow = await this.userRepository.findOne({
      where: { id: createFollowDto.following_id },
    });

    if (!userToFollow) {
      throw new NotFoundException('User to follow not found');
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        follower: { id: userId },
        following: { id: createFollowDto.following_id },
      },
      withDeleted: true,
    });

    if (existingFollow) {
      if (existingFollow.deleted_at) {
        await this.followRepository.restore(existingFollow.id);
      } else {
        throw new ConflictException('You are already following this user');
      }
    } else {
      const follow = this.followRepository.create({
        follower: { id: userId },
        following: { id: createFollowDto.following_id },
      });
      await this.followRepository.save(follow);
    }

    return { code: 1, message: 'Successfully followed user', data: [] };
  }

  async unfollowUser(userId: string, unfollowDto: UnfollowDto) {
    if (userId === unfollowDto.following_id) {
      throw new ConflictException('You cannot unfollow yourself');
    }

    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: userId },
        following: { id: unfollowDto.following_id },
      },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    await this.followRepository.softDelete(follow.id);

    return { code: 1, message: 'Successfully unfollowed user', data: [] };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    return !!follow;
  }
}