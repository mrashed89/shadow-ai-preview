import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="relative flex min-h-dvh flex-col justify-center px-5 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-lg text-center">
        <p className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-white sm:text-6xl">
          Shadow AI
        </p>
        <p className="mt-3 text-sm text-white/55">
          Sign in to call your forever buddy. Demo login — no password.
        </p>
        <div className="mt-10 text-left">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
