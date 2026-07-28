import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TrackIndia" },
      { name: "description", content: "Sign in to TrackIndia to build a portfolio and watchlist." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      router.navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto mt-16 px-4">
      <div className="glass-strong rounded-3xl p-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your positions and watchlist across the live news tape.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/70 border-white/80" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/70 border-white/80" />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>New here?{" "}
              <button className="text-accent font-medium" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button className="text-accent font-medium" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to the tape</Link>
        </div>
      </div>
    </section>
  );
}
