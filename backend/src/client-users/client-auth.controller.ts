import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ClientUsersService } from './client-users.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientRegisterDto } from './dto/client-register.dto';
import { ClientJwtAuthGuard } from './guards/client-jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@Controller('client-auth')
export class ClientAuthController {
  constructor(private readonly clientUsersService: ClientUsersService) {}

  @Post('register')
  async register(@Body() registerDto: ClientRegisterDto) {
    return this.clientUsersService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: ClientLoginDto) {
    return this.clientUsersService.login(loginDto);
  }

  @Get('me')
  @UseGuards(ClientJwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    return this.clientUsersService.getMe(user.id);
  }
}

