import api from "./api";

export type BillingPlanId = "free" | "plus" | "pro";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  description: string;
  price: number;
  interval: "month";
  features: string[];
}

export interface SubscriptionState {
  plan: BillingPlanId;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export const billingService = {
  async getPlans(): Promise<BillingPlan[]> {
    const response = await api.get<{ success: boolean; data: BillingPlan[] }>(
      "/billing/plans",
    );
    return response.data.data;
  },

  async getSubscription(): Promise<SubscriptionState> {
    const response = await api.get<{
      success: boolean;
      data: SubscriptionState;
    }>("/billing/subscription");
    return response.data.data;
  },

  async createCheckoutSession(planId: BillingPlanId) {
    const response = await api.post<{
      success: boolean;
      data: { checkoutUrl: string | null; plan?: BillingPlanId };
      message?: string;
    }>("/billing/checkout-session", { planId });
    return response.data;
  },

  async completeCheckout(sessionId: string) {
    const response = await api.post<{
      success: boolean;
      data: { plan: BillingPlanId; status: string };
      message: string;
    }>("/billing/complete-checkout", { sessionId });
    return response.data;
  },
};

