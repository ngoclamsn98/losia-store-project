import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClientUser, ClientUserRole } from './entities/client-user.entity';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientRegisterDto } from './dto/client-register.dto';

@Injectable()
export class ClientUsersService {
  constructor(
    @InjectRepository(ClientUser)
    private readonly clientUserRepository: Repository<ClientUser>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createDto: CreateClientUserDto) {
    // Check if email already exists
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create user
    const user = this.clientUserRepository.create({
      email: createDto.email,
      passwordHash: hashedPassword,
      name: createDto.name,
      phone: createDto.phone,
      role: createDto.role,
    });

    const savedUser = await this.clientUserRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async findAll(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Build query
    const queryBuilder = this.clientUserRepository.createQueryBuilder('user');

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.name ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Remove password hash from results
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    return {
      data: sanitizedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.clientUserRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Client user not found');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.clientUserRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateDto: UpdateClientUserDto) {
    const user = await this.clientUserRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Client user not found');
    }

    // Update fields
    if (updateDto.name !== undefined) user.name = updateDto.name;
    if (updateDto.phone !== undefined) user.phone = updateDto.phone;
    if (updateDto.role !== undefined) user.role = updateDto.role;
    if (updateDto.isActive !== undefined) user.isActive = updateDto.isActive;
    if (updateDto.emailVerified !== undefined)
      user.emailVerified = updateDto.emailVerified;

    // Update password if provided
    if (updateDto.password) {
      user.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    const savedUser = await this.clientUserRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async delete(id: string) {
    const user = await this.clientUserRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Client user not found');
    }

    await this.clientUserRepository.remove(user);
    return { message: 'Client user deleted successfully' };
  }

  async updateLastLogin(id: string) {
    await this.clientUserRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async getStats() {
    const total = await this.clientUserRepository.count();
    const active = await this.clientUserRepository.count({
      where: { isActive: true },
    });
    const verified = await this.clientUserRepository.count({
      where: { emailVerified: true },
    });

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
    };
  }

  // Auth methods for client users
  async register(registerDto: ClientRegisterDto) {
    // Check if email already exists
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.clientUserRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
      role: ClientUserRole.CUSTOMER,
      isActive: true,
      emailVerified: false,
    });

    const savedUser = await this.clientUserRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      type: 'client', // Distinguish from admin users
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last login
    await this.updateLastLogin(savedUser.id);

    // Return user data and access token
    const { passwordHash, ...userWithoutPassword } = savedUser;
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: ClientLoginDto) {
    // Find user by email
    const user = await this.clientUserRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'client', // Distinguish from admin users
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last login
    await this.updateLastLogin(user.id);

    // Return user data and access token
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async getMe(userId: string) {
    const user = await this.clientUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

