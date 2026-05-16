import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    const userProfile = await this.userService.getUserProfile(user.userId);
    if (!userProfile) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    return {
      success: true,
      data: {
        id: userProfile._id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      },
    };
  }
}
