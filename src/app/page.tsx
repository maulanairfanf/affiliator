import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Affiliator</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        Affiliate Content Automation — search products, generate content, and schedule posts.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
