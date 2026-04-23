import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex-grow flex flex-col items-center justify-center relative px-6 bg-background-dark text-slate-100 min-h-screen">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>
      <div className="max-w-4xl w-full text-center space-y-12 z-10">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-[1] tracking-tighter">
            Scale Faster. <br />
            <span className="text-primary">Track Less.</span>
          </h1>
        </div>
        <div className="flex flex-col items-center gap-6">
          <p className="text-primary font-bold tracking-widest uppercase text-sm md:text-base">
            Automated FIFO for high-volume resellers
          </p>

          {userId ? (
            <Link
              href="/dashboard"
              className="group relative bg-primary hover:bg-primary/90 text-white px-12 py-6 rounded-2xl font-black text-2xl md:text-3xl transition-all shadow-glow-primary hover:scale-105 active:scale-95 flex items-center gap-4"
            >
              Go to Dashboard
              <span className="font-bold text-3xl">→</span>
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <button
                type="button"
                className="group relative bg-primary hover:bg-primary/90 text-white px-12 py-6 rounded-2xl font-black text-2xl md:text-3xl transition-all shadow-glow-primary hover:scale-105 active:scale-95 flex items-center gap-4 cursor-pointer"
              >
                Get Started Now
                <span className="font-bold text-3xl">→</span>
              </button>
            </SignUpButton>
          )}

          <p className="text-slate-500 text-sm font-medium">
            Setup in 2 minutes • No credit card required
          </p>
        </div>
      </div>
    </main>
  );
}
