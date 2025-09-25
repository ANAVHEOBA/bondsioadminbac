import { Test, TestingModule } from '@nestjs/testing';
import { UserInterestsController } from './user-interests.controller';
import { UserInterestsService } from './user-interests.service';

describe('UserInterestsController', () => {
  let controller: UserInterestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserInterestsController],
      providers: [UserInterestsService],
    }).compile();

    controller = module.get<UserInterestsController>(UserInterestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
