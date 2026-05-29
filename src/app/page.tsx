import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function Home() {
  const {
    data: { user },
  } = await getAuthUser();

  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas-soft text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl space-y-12 text-center">
          <div className="space-y-4">
            <p className="font-display text-display-sm font-extrabold tracking-tight text-primary">
              BoxiStock
            </p>
            <h1 className="font-display text-display-lg tracking-tighter text-ink-deep md:text-display-xxl">
              Scale Faster. <br />
              <span className="text-primary">Track Less.</span>
            </h1>
          </div>
          <div className="flex flex-col items-center gap-6">
            <p className="text-caption uppercase tracking-widest text-primary md:text-body-md-strong">
              Automated FIFO for high-volume resellers
            </p>

            <Link
              href="/sign-in"
              className="group relative flex cursor-pointer items-center gap-4 rounded-xl bg-primary px-12 py-6 text-display-xs text-ink-deep shadow-glow-primary transition-all hover:scale-105 hover:bg-primary-active active:scale-95 md:text-display-sm"
            >
              Get Started Now
              <span className="text-display-xs">→</span>
            </Link>

            <p className="text-body-sm-strong text-mute">
              Setup in 2 minutes • No credit card required
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
