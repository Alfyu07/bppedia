import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <section className="mx-auto w-full max-w-md space-y-6 px-4 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin BPPedia</h1>
        <p className="text-muted-foreground">
          Masuk untuk mengelola konten dan sumber pengetahuan BPPedia.
        </p>
      </div>
      <AdminLoginForm />
    </section>
  );
}
