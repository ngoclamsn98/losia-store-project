import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientUsersService } from './client-users.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MinLevel } from '../common/decorators/min-level.decorator';
import { USER_LEVELS } from 'src/common/constants/user-levels.constant';

@Controller('client-users')
@UseGuards(JwtAuthGuard)
export class ClientUsersController {
  constructor(private readonly clientUsersService: ClientUsersService) {}

  @Post()
  @MinLevel(USER_LEVELS.ADMIN)
  create(@Body() createDto: CreateClientUserDto) {
    return this.clientUsersService.create(createDto);
  }

  @Get()
  @MinLevel(USER_LEVELS.STAFF)
  findAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientUsersService.findAll({
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('stats')
  @MinLevel(USER_LEVELS.STAFF)
  getStats() {
    return this.clientUsersService.getStats();
  }

  @Get(':id')
  @MinLevel(USER_LEVELS.STAFF)
  findOne(@Param('id') id: string) {
    return this.clientUsersService.findOne(id);
  }

  @Put(':id')
  @MinLevel(USER_LEVELS.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateClientUserDto) {
    return this.clientUsersService.update(id, updateDto);
  }

  @Delete(':id')
  @MinLevel(USER_LEVELS.ADMIN)
  delete(@Param('id') id: string) {
    return this.clientUsersService.delete(id);
  }
}

