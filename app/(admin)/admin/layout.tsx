import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Wordmark href="/admin" suffix="Admin" />
          <Link className="text-sm text-muted-foreground" href="/">
            Buka chat
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
