import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-8 py-6 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
      <span>© {new Date().getFullYear()} BoxiStock. All rights reserved.</span>
      <nav className="flex items-center gap-4">
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </Link>
        <Link
          href="/privacy"
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
        <Link
          href="/contact"
          className="hover:text-foreground transition-colors"
        >
          Contact Us
        </Link>
      </nav>
    </footer>
  );
}
