import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { PLANS } from "@/lib/subscription.functions";

export function Paywall() {
  return (
    <section className="max-w-lg mx-auto mt-10 md:mt-16 px-3 pb-28">
      <div className="glass-strong rounded-3xl p-6 md:p-8 text-center">
        <div className="mx-auto w-11 h-11 rounded-2xl glass flex items-center justify-center">
          <Lock size={18} className="text-primary" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">Your free trial has ended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep the live tape, IPO tracker, policy tracker and alerts running for ₹{PLANS.monthly.amount}/month
          or ₹{PLANS.yearly.amount}/year.
        </p>
        <Link
          to="/pricing"
          className="mt-5 inline-flex rounded-full glass-btn-primary px-5 py-2.5 text-sm font-semibold"
        >
          See plans
        </Link>
      </div>
    </section>
  );
}
