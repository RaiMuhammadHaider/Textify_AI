import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [UserModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}

