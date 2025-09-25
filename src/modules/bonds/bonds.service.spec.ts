import { Test, TestingModule } from '@nestjs/testing';
import { CreateBondDto } from './dto/create-bond.dto';
import { UpdateBondDto } from './dto/update-bond.dto';

// Mock the entire bonds service
jest.mock('./bonds.service', () => ({
  BondsService: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadBanner: jest.fn(),
  })),
}));

describe('BondsService - Banner Upload and Co-organizers', () => {
  let mockBondsService: any;

  beforeEach(async () => {
    const { BondsService } = require('./bonds.service');
    mockBondsService = new BondsService();
  });

  describe('create', () => {
    it('should create a bond with co-organizers, rules, and banner file', async () => {
      const createBondDto: CreateBondDto = {
        name: 'Test Bond',
        city: 'Test City',
        latitude: '40.7128',
        longitude: '-74.0060',
        description: 'Test description',
        max_members: 100,
        is_unlimited_members: false,
        request_to_join: true,
        is_public: true,
        post_to_story: true,
        co_organizers: ['4dmmd-1234-5678-9012-345678901234', '4dmmd-1234-5678-9012-345678901235'],//uuids
        rules: 'Rule 1, Rule 2',
        users: ['4dmmd-1234-5678-9012-345678901234', '4dmmd-1234-5678-9012-345678901235', '4dmmd-1234-5678-9012-345678901236'],
        user_interests: ['interest-uuid-1', 'interest-uuid-2'],
      };
      const mockFile = {
        fieldname: 'banner',
        originalname: 'banner.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      const expectedResult = {
        code: 1,
        message: 'Bond created successfully',
        data: {
          id: 1,
          name: 'Test Bond',
          banner: 'https://s3.amazonaws.com/bucket/banner.jpg',
        },
      };
      mockBondsService.create.mockResolvedValue(expectedResult);
      const result = await mockBondsService.create(createBondDto, mockFile);
      expect(result).toEqual(expectedResult);
      expect(mockBondsService.create).toHaveBeenCalledWith(createBondDto, mockFile);
    });
    it('should create a bond with default banner if no file provided', async () => {
      const createBondDto: CreateBondDto = {
        name: 'Test Bond',
        city: 'Test City',
        latitude: '40.7128',
        longitude: '-74.0060',
        description: 'Test description',
        max_members: 100,
        is_unlimited_members: false,
        request_to_join: true,
        is_public: true,
        post_to_story: true,
        co_organizers: ['4dmmd-1234-5678-9012-345678901234', '4dmmd-1234-5678-9012-345678901235'],
        rules: 'Rule 1, Rule 2',
        users: ['4dmmd-1234-5678-9012-345678901234', '4dmmd-1234-5678-9012-345678901235', '4dmmd-1234-5678-9012-345678901236'],
        user_interests: ['interest-uuid-1', 'interest-uuid-2'],
      };
      const expectedResult = {
        code: 1,
        message: 'Bond created successfully',
        data: {
          id: 1,
          name: 'Test Bond',
          banner: 'default-banner.jpg',
        },
      };
      mockBondsService.create.mockResolvedValue(expectedResult);
      const result = await mockBondsService.create(createBondDto, undefined);
      expect(result).toEqual(expectedResult);
      expect(mockBondsService.create).toHaveBeenCalledWith(createBondDto, undefined);
    });
  });

  describe('update', () => {
    it('should update a bond and replace banner if new file provided', async () => {
      const updateBondDto: UpdateBondDto = {
        name: 'Updated Bond',
        rules: 'Updated Rule',
      };
      const mockFile = {
        fieldname: 'banner',
        originalname: 'banner2.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test2'),
        size: 2048,
      } as Express.Multer.File;
      const expectedResult = {
        code: 1,
        message: 'Bond updated successfully',
        data: {
          id: 1,
          name: 'Updated Bond',
          banner: 'https://s3.amazonaws.com/bucket/banner2.jpg',
        },
      };
      mockBondsService.update.mockResolvedValue(expectedResult);
      const result = await mockBondsService.update(1, updateBondDto, mockFile);
      expect(result).toEqual(expectedResult);
      expect(mockBondsService.update).toHaveBeenCalledWith(1, updateBondDto, mockFile);
    });
    it('should update a bond and keep existing banner if no file provided', async () => {
      const updateBondDto: UpdateBondDto = {
        name: 'Updated Bond',
        rules: 'Updated Rule',
      };
      const expectedResult = {
        code: 1,
        message: 'Bond updated successfully',
        data: {
          id: 1,
          name: 'Updated Bond',
          banner: 'existing-banner.jpg',
        },
      };
      mockBondsService.update.mockResolvedValue(expectedResult);
      const result = await mockBondsService.update(1, updateBondDto, undefined);
      expect(result).toEqual(expectedResult);
      expect(mockBondsService.update).toHaveBeenCalledWith(1, updateBondDto, undefined);
    });
  });

  describe('uploadBanner', () => {
    it('should upload banner successfully', async () => {
      const bondId = 1;
      const mockFile = {
        fieldname: 'banner',
        originalname: 'banner.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      const expectedResult = {
        code: 1,
        message: 'Banner uploaded successfully',
        data: { banner: 'https://s3.amazonaws.com/bucket/new-banner.jpg' },
      };
      mockBondsService.uploadBanner.mockResolvedValue(expectedResult);
      const result = await mockBondsService.uploadBanner(bondId, mockFile);
      expect(result).toEqual(expectedResult);
      expect(mockBondsService.uploadBanner).toHaveBeenCalledWith(bondId, mockFile);
    });
    it('should handle bond not found error', async () => {
      const bondId = 999;
      const mockFile = {
        fieldname: 'banner',
        originalname: 'banner.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;
      mockBondsService.uploadBanner.mockRejectedValue(new Error('Bond not found'));
      await expect(mockBondsService.uploadBanner(bondId, mockFile)).rejects.toThrow('Bond not found');
    });
  });
});
