import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherStatus, VoucherType } from './entities/voucher.entity';
import { VoucherUsage } from './entities/voucher-usage.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ValidateVoucherDto, ValidateVoucherResponseDto } from './dto/validate-voucher.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(VoucherUsage)
    private voucherUsageRepository: Repository<VoucherUsage>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Check if code already exists
    const existing = await this.voucherRepository.findOne({
      where: { code: createVoucherDto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Voucher code already exists');
    }

    const voucher = this.voucherRepository.create({
      ...createVoucherDto,
      code: createVoucherDto.code.toUpperCase(),
    });

    return await this.voucherRepository.save(voucher);
  }

  async findAll(filters?: {
    status?: VoucherStatus;
    type?: VoucherType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Voucher>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.voucherRepository.createQueryBuilder('voucher');

    if (filters?.status) {
      query.andWhere('voucher.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('voucher.type = :type', { type: filters.type });
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(voucher.code) LIKE LOWER(:search) OR LOWER(voucher.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('voucher.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return voucher;
  }

  async findByCode(code: string): Promise<Voucher | null> {
    return await this.voucherRepository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);

    // If updating code, check for conflicts
    if (updateVoucherDto.code && updateVoucherDto.code !== voucher.code) {
      const existing = await this.voucherRepository.findOne({
        where: { code: updateVoucherDto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException('Voucher code already exists');
      }
      updateVoucherDto.code = updateVoucherDto.code.toUpperCase();
    }

    Object.assign(voucher, updateVoucherDto);
    return await this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepository.remove(voucher);
  }

  /**
   * Validate voucher and calculate discount
   */
  async validateVoucher(dto: ValidateVoucherDto): Promise<ValidateVoucherResponseDto> {
    const voucher = await this.findByCode(dto.code);

    if (!voucher) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher không tồn tại',
      };
    }

    // Check status
    if (voucher.status !== VoucherStatus.ACTIVE) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher không còn hiệu lực',
      };
    }

    // Check date range
    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher chưa có hiệu lực',
      };
    }
    if (voucher.endDate && now > voucher.endDate) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher đã hết hạn',
      };
    }

    // Check usage limit
    if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher đã hết lượt sử dụng',
      };
    }

    // Check authenticated only
    if (voucher.isAuthenticatedOnly && !dto.clientUserId) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Mã voucher chỉ dành cho khách hàng đã đăng nhập',
      };
    }

    // Check usage limit per user
    if (dto.clientUserId && voucher.usageLimitPerUser !== null) {
      const userUsageCount = await this.voucherUsageRepository.count({
        where: {
          voucherId: voucher.id,
          clientUserId: dto.clientUserId,
        },
      });

      if (userUsageCount >= voucher.usageLimitPerUser) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Bạn đã sử dụng hết lượt áp dụng mã này',
        };
      }
    }

    // Check minimum order value
    if (dto.orderValue < voucher.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng mã này`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.type === VoucherType.PERCENTAGE) {
      discountAmount = (dto.orderValue * voucher.value) / 100;
      // Apply max discount if set
      if (voucher.maxDiscount !== null && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = voucher.value;
    }

    // Discount cannot exceed order value
    if (discountAmount > dto.orderValue) {
      discountAmount = dto.orderValue;
    }

    return {
      valid: true,
      discountAmount: Math.round(discountAmount),
      message: 'Mã voucher hợp lệ',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        description: voucher.description || '',
        type: voucher.type,
        value: Number(voucher.value),
      },
    };
  }

  /**
   * Record voucher usage
   */
  async recordUsage(
    voucherId: string,
    clientUserId: string | null,
    orderId: string,
    discountAmount: number,
  ): Promise<VoucherUsage> {
    // Increment usage count
    await this.voucherRepository.increment({ id: voucherId }, 'usageCount', 1);

    // Create usage record
    const usage = this.voucherUsageRepository.create({
      voucherId,
      clientUserId,
      orderId,
      discountAmount,
    });

    return await this.voucherUsageRepository.save(usage);
  }

  /**
   * Get voucher usage history
   */
  async getUsageHistory(voucherId: string): Promise<VoucherUsage[]> {
    return await this.voucherUsageRepository.find({
      where: { voucherId },
      order: { usedAt: 'DESC' },
    });
  }

  /**
   * Get user's voucher usage history
   */
  async getUserUsageHistory(clientUserId: string): Promise<VoucherUsage[]> {
    return await this.voucherUsageRepository.find({
      where: { clientUserId },
      relations: ['voucher'],
      order: { usedAt: 'DESC' },
    });
  }
}

