import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';
@Controller('product')
export class ProductController {
  constructor(private readonly ProductService: ProductService) {}
  @Get('Product')
  getProduct(): string {
    return this.ProductService.getProduct();
  }
}
