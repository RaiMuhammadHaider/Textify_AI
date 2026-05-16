import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  getProduct(): string {
    return 'This is product ';
  }
  getProductDetail(): string {
    return 'This is product ';
  }
}
