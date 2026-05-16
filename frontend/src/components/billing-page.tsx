import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BillingPlan,
  BillingPlanId,
  billingService,
  SubscriptionState,
} from "@/services/billing.service";

const planIcon = {
  free: Sparkles,
  plus: Zap,
  pro: ShieldCheck,
};

export const BillingPage = () => {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<BillingPlanId | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionId = searchParams.get("session_id");
  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  const currentPlan = subscription?.plan || "free";
  const featuredPlan = useMemo(() => plans.find((plan) => plan.id === "plus"), [
    plans,
  ]);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const [plansResponse, subscriptionResponse] = await Promise.all([
          billingService.getPlans(),
          billingService.getSubscription(),
        ]);
        setPlans(plansResponse);
        setSubscription(subscriptionResponse);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Billing unavailable",
          description:
            error.response?.data?.message || "Could not load billing plans.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBilling();
  }, [toast]);

  useEffect(() => {
    if (!checkoutCancelled) return;

    toast({
      title: "Checkout cancelled",
      description: "No payment was taken. Your current plan is unchanged.",
    });
    setSearchParams({});
  }, [checkoutCancelled, setSearchParams, toast]);

  useEffect(() => {
    const verifyCheckout = async () => {
      if (!sessionId || verifying) return;

      setVerifying(true);
      try {
        const response = await billingService.completeCheckout(sessionId);
        setSubscription({
          plan: response.data.plan,
          status: response.data.status,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        });
        toast({
          title: "Plan activated",
          description: response.message,
        });
        setSearchParams({});
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Checkout verification failed",
          description:
            error.response?.data?.message ||
            "Payment completed, but plan verification failed.",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyCheckout();
  }, [sessionId, setSearchParams, toast, verifying]);

  const handleChoosePlan = async (planId: BillingPlanId) => {
    setCheckoutPlan(planId);
    try {
      const response = await billingService.createCheckoutSession(planId);

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }

      setSubscription((previous) => ({
        plan: response.data.plan || "free",
        status: "active",
        stripeCustomerId: previous?.stripeCustomerId || null,
        stripeSubscriptionId: previous?.stripeSubscriptionId || null,
      }));
      toast({
        title: "Plan updated",
        description: response.message || "Your plan has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description:
          error.response?.data?.message ||
          "Could not start Stripe checkout. Please try again.",
      });
    } finally {
      setCheckoutPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="h-full overflow-auto bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="h-8 px-2 text-muted-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to workspace
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">
                Plans & Billing
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the right AI writing plan and manage access from one
                place.
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Current plan
            </p>
            <p className="text-lg font-semibold capitalize">{currentPlan}</p>
          </div>
        </div>

        {verifying && (
          <div className="flex items-center rounded-lg border bg-primary/5 px-4 py-3 text-sm text-primary">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying Stripe checkout and activating your plan...
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = planIcon[plan.id];
            const isCurrent = currentPlan === plan.id;
            const isFeatured = featuredPlan?.id === plan.id;
            const isBusy = checkoutPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={
                  isFeatured
                    ? "border-primary shadow-sm"
                    : "border-border/80 shadow-none"
                }
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      {isFeatured && <Badge>Popular</Badge>}
                      {isCurrent && <Badge variant="secondary">Active</Badge>}
                    </div>
                  </div>
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-semibold">
                      {plan.price === 0 ? "Free" : `$${plan.price / 100}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="pb-1 text-sm text-muted-foreground">
                        / month
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || isBusy}
                    onClick={() => handleChoosePlan(plan.id)}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting checkout...
                      </>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : plan.price === 0 ? (
                      "Use free plan"
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Upgrade with Stripe
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
};

