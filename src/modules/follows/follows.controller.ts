import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FollowsService } from './follows.service';

@ApiTags('Admin – Follows (read-only)')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers of any user' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiResponse({ status: 200, description: 'List of followed users' })
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Follower / following counts' })
  @ApiResponse({ status: 200, description: 'Counts only' })
  getFollowStats(@Param('userId') userId: string) {
    return this.followsService.getFollowStats(userId);
  }
}