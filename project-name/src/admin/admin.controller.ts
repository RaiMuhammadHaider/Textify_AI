import { Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('admin')
  getAdmin(): any {
    return this.adminService.getAdmin();
  }
  @Post('filltheForm')
  filltheForm(): any {
    {
      return this.adminService.filltheFormForAdmin();
    }
  }
}
