export type BillingPlanId = 'free' | 'plus' | 'pro';

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  description: string;
  price: number;
  interval: 'month';
  stripeLookupKey?: string;
  features: string[];
}

