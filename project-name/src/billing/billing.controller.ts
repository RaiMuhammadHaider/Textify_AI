import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import type { BillingPlanId } from './billing.types';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  createCheckoutSession(
    @CurrentUser() user: any,
    @Body('planId') planId: string,
  ) {
    return this.billingService.createCheckoutSession(
      user.userId,
      planId as BillingPlanId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-checkout')
  completeCheckout(
    @CurrentUser() user: any,
    @Body('sessionId') sessionId: string,
  ) {
    return this.billingService.completeCheckout(user.userId, sessionId);
  }
}
