import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getStringName(): string {
    return 'Hello World! string';
  }
}
