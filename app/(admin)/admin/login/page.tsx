import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin BPPedia</h1>
        <p className="text-muted-foreground">
          Login admin akan tersedia pada tahap frontend berikutnya.
        </p>
      </div>
      <Link className="text-sm underline underline-offset-4" href="/">
        Kembali ke chat
      </Link>
    </section>
  );
}
