import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LevelGuard } from '../common/guards/level.guard';
import { MinLevel } from '../common/decorators/min-level.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { USER_LEVELS } from '../common/constants/user-levels.constant';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, LevelGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.create(createUserDto, currentUser.level);
  }

  @Get()
  @MinLevel(USER_LEVELS.STAFF)
  @ApiOperation({ summary: 'Get all users with optional filters (Staff and above)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by user role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in email, first name, last name' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  findAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  @Get(':id')
  @MinLevel(USER_LEVELS.STAFF)
  @ApiOperation({ summary: 'Get user by ID (Staff and above)' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser.level);
  }

  @Delete(':id')
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.remove(id, currentUser.level);
  }
}

