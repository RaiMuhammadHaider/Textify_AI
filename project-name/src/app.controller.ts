import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { get } from 'http';

@Controller("mainController")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get("anyName")
  getstringName(): string {
    return this.appService.getStringName();
  }
}
