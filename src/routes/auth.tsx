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
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const candidate = search.next;
    return typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\") && !/[\r\n]/.test(candidate)
      ? { next: candidate }
      : {};
  },
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
        content: "Username or email login, plus Google, Apple and Microsoft sign-in, for TrackIndia markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next: requestedNext } = Route.useSearch();
  const next = requestedNext ?? "/";
  const returnTo = () => `${window.location.origin}/auth?next=${encodeURIComponent(next)}`;
  const router = useRouter();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("type") === "recovery") setRecovering(true);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    setRecoveryChecked(true);
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (recoveryChecked && user && !recovering) window.location.assign(next);
  }, [user, router, next, recovering, recoveryChecked]);

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (recoveryPassword !== confirmRecoveryPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      toast.success("Password updated.");
      window.location.assign(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

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
        emailRedirectTo: returnTo(),
        data: { display_name: username.trim() || email.split("@")[0] },
      },
    });
    if (error) throw error;
    if (!data.session) {
      toast.success("Account created. Confirm your email, then sign in for free access.");
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
    toast.success("Your free access is ready.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") await signUp();
      else await signIn();
      if (mode === "signin" || (await supabase.auth.getSession()).data.session) window.location.assign(next);
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

  const socialSignIn = async (provider: "google" | "apple" | "microsoft") => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: returnTo(),
      });
      if (res.error) throw res.error;
      if (!("redirected" in res && res.redirected)) window.location.assign(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${provider === "apple" ? "Apple" : provider === "microsoft" ? "Microsoft" : "Google"} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    const target = (mode === "signin" ? identifier : email).trim();
    if (!target.includes("@")) {
      toast("Enter your email address first", { description: "Password resets are sent by email." });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: returnTo(),
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent — check your inbox.");
  };

  if (recovering) {
    return (
      <section className="max-w-md mx-auto mt-10 md:mt-16 px-3 md:px-4 pb-24">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter a new password for your TrackIndia account.</p>
          <form onSubmit={setNewPassword} className="mt-5 space-y-4">
            <Field
              id="recovery-password"
              label="New password"
              type="password"
              icon={<KeyRound size={14} />}
              value={recoveryPassword}
              onChange={setRecoveryPassword}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <Field
              id="confirm-recovery-password"
              label="Confirm new password"
              type="password"
              icon={<KeyRound size={14} />}
              value={confirmRecoveryPassword}
              onChange={setConfirmRecoveryPassword}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
              {loading ? "…" : "Update password"}
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto mt-10 md:mt-16 px-3 md:px-4 pb-24">
      <div className="glass-strong rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Use your username or email with your password."
            : "Pick a username, register with email — or continue with Google, Apple or Microsoft. Access is currently free."}
        </p>

        <div className="mt-5 space-y-2.5">
          <Button onClick={() => socialSignIn("google")} type="button" variant="outline" disabled={loading} className="w-full h-11 font-semibold">
            <GoogleMark /> Continue with Google
          </Button>
          <Button onClick={() => socialSignIn("apple")} type="button" variant="outline" disabled={loading} className="w-full h-11 font-semibold">
            <AppleMark /> Continue with Apple
          </Button>
          <Button onClick={() => socialSignIn("microsoft")} type="button" variant="outline" disabled={loading} className="w-full h-11 font-semibold">
            <MicrosoftMark /> Continue with Microsoft
          </Button>
        </div>

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

function AppleMark() {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-44.3 36.2-65.9 37.9-67-20.6-30-52.6-34.1-63.9-34.4-26.9-2.8-53 16.1-66.7 16.1-13.9 0-34.9-15.8-57.6-15.4-29.6.4-57.3 17.6-72.6 44.2-31.4 54.5-8 134.6 22.1 178.5 15 21.6 32.7 45.8 55.8 44.9 22.4-.9 30.8-14.5 57.9-14.5 26.9 0 34.4 14.5 58.1 14 24.1-.4 39.3-21.7 53.8-43.5 17.3-25.3 24.4-50.1 24.8-51.4-.5-.2-47-18-47.5-71.9ZM270.4 138.8c12.1-14.7 20.5-35.2 18.2-55.7-17.5.7-38.6 11.7-51.2 26.4-11.3 13-21.2 34.6-18.6 54.4 19.6 1.5 39.6-9.9 51.6-25.1Z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 2h9.5v9.5H2zM12.5 2H22v9.5h-9.5zM2 12.5h9.5V22H2zM12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}
