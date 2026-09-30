import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AtSign, KeyRound, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { signInWithIdentifier, claimUsername } from "@/lib/auth.functions";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or register — TrackIndia" },
      {
        name: "description",
        content:
          "Sign in with your username or email, or register in seconds to track market news, IPOs, government policies and your watchlist on TrackIndia.",
      },
      { property: "og:title", content: "Sign in or register — TrackIndia" },
      {
        property: "og:description",
        content: "Username or email login, plus Google sign-in, for the TrackIndia live market tape.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.navigate({ to: "/" });
  }, [user, router]);

  const signIn = async () => {
    const tokens = await signInWithIdentifier({
      data: { identifier: identifier.trim(), password },
    });
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (error) throw error;
    toast.success("Welcome back.");
  };

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: username.trim() || email.split("@")[0] },
      },
    });
    if (error) throw error;
    if (!data.session) {
      toast.success("Account created. Confirm your email, then sign in to start your 7-day free trial.");
      setMode("signin");
      setIdentifier(email.trim());
      return;
    }
    if (username.trim()) {
      try {
        await claimUsername({ data: { username: username.trim() } });
      } catch {
        toast("Signed up, but that username was taken — set another in Account.");
      }
    }
    toast.success("Your 7-day free trial has started.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") await signUp();
      else await signIn();
      if (mode === "signin" || (await supabase.auth.getSession()).data.session) router.navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      toast.error(
        /INVALID_CREDENTIALS|invalid login credentials/i.test(msg)
          ? "Wrong username/email or password."
          : /already registered|already been registered/i.test(msg)
            ? "That email already has an account — sign in instead."
            : /USERNAME_TAKEN/.test(msg)
              ? "That username is taken."
              : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) throw res.error;
      if (!("redirected" in res && res.redirected)) router.navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const reset = async () => {
    const target = (mode === "signin" ? identifier : email).trim();
    if (!target.includes("@")) {
      toast("Enter your email address first", { description: "Password resets are sent by email." });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: window.location.origin,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent — check your inbox.");
  };

  return (
    <section className="max-w-md mx-auto mt-10 md:mt-16 px-3 md:px-4 pb-24">
      <div className="glass-strong rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Use your username or email with your password."
            : "Pick a username, register with email — or continue with Google. Your 7-day free trial starts when you create your account."}
        </p>

        <button
          onClick={google}
          type="button"
          className="mt-5 w-full glass glass-hover rounded-full h-11 flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
        >
          <GoogleMark /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          <span className="h-px flex-1 bg-white/70" /> or
          <span className="h-px flex-1 bg-white/70" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signin" ? (
            <Field
              id="identifier"
              label="Username or email"
              icon={<AtSign size={14} />}
              value={identifier}
              onChange={setIdentifier}
              autoComplete="username"
              placeholder="satish or you@email.com"
              required
            />
          ) : (
            <>
              <Field
                id="username"
                label="Username"
                icon={<User size={14} />}
                value={username}
                onChange={setUsername}
                autoComplete="username"
                placeholder="satish"
                minLength={3}
                maxLength={24}
                required
              />
              <Field
                id="email"
                label="Email"
                type="email"
                icon={<Mail size={14} />}
                value={email}
                onChange={setEmail}
                autoComplete="email"
                placeholder="you@email.com"
                required
              />
            </>
          )}
          <Field
            id="password"
            label="Password"
            type="password"
            icon={<KeyRound size={14} />}
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
          <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" className="text-accent font-medium" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create an account" : "I already have an account"}
          </button>
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={reset}>
            Forgot password?
          </button>
        </div>

      </div>
    </section>
  );
}

function Field({
  id,
  label,
  icon,
  value,
  onChange,
  ...rest
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.6z" />
      <path fill="#FBBC05" d="M10.3 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-3.7-13.7-9.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
