import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function Home() {
  const {
    data: { user },
  } = await getAuthUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex-grow flex flex-col items-center justify-center relative px-6 bg-canvas-soft text-ink min-h-screen">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-4xl w-full text-center space-y-12 z-10">
        <div className="space-y-4">
          <p className="font-display text-display-sm text-primary font-extrabold tracking-tight">
            BoxiStock
          </p>
          <h1 className="font-display text-display-lg md:text-display-xxl text-ink-deep tracking-tighter">
            Scale Faster. <br />
            <span className="text-primary">Track Less.</span>
          </h1>
        </div>
        <div className="flex flex-col items-center gap-6">
          <p className="text-primary text-caption md:text-body-md-strong tracking-widest uppercase">
            Automated FIFO for high-volume resellers
          </p>

          <Link
            href="/sign-in"
            className="group relative bg-primary hover:bg-primary-active text-ink-deep px-12 py-6 rounded-xl text-display-xs md:text-display-sm transition-all shadow-glow-primary hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            Get Started Now
            <span className="text-display-xs">→</span>
          </Link>

          <p className="text-mute text-body-sm-strong">
            Setup in 2 minutes • No credit card required
          </p>
        </div>
      </div>
    </main>
  );
}
