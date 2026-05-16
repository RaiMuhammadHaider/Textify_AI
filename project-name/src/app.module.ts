import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { ProductModule } from './product/product.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    // 1. Move ConfigModule to the top and set isGlobal: true
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Use forRootAsync so it waits for the environment variables to load
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.mongoURL,
      }),
    }),

    ProductModule,
    AdminModule,
    UserModule,
    AuthModule,
    BillingModule,
  ],
  controllers: [AppController, ProductController],
  providers: [AppService, ProductService],
})
export class AppModule {}
