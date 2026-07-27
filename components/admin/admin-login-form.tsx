"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AdminAuthMockResult,
  type AdminAuthMockScenario,
  mockAdminLogin,
} from "@/lib/mocks/admin-auth";

interface AdminLoginFormProps {
  initialResult?: AdminAuthMockResult;
}

export function AdminLoginForm({ initialResult }: AdminLoginFormProps) {
  const [result, setResult] = useState<AdminAuthMockResult | undefined>(
    initialResult
  );
  const isLoading = result?.status === "loading";

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const credentials = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    setResult(mockAdminLogin(credentials, "loading"));

    setTimeout(() => {
      const scenario: AdminAuthMockScenario = credentials.identifier.includes(
        "unavailable"
      )
        ? "failure"
        : credentials.password === "mock-password"
          ? "success"
          : "invalid-credentials";
      const nextResult = mockAdminLogin(credentials, scenario);

      if (nextResult.status === "success") {
        window.location.assign("/admin");
        return;
      }

      setResult(nextResult);
    }, 500);
  }, []);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="admin-identifier">Email admin</Label>
        <Input
          autoComplete="username"
          disabled={isLoading}
          id="admin-identifier"
          name="identifier"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Kata sandi</Label>
        <Input
          autoComplete="current-password"
          disabled={isLoading}
          id="admin-password"
          name="password"
          required
          type="password"
        />
      </div>
      {isLoading ? <p role="status">Memproses login…</p> : null}
      {result?.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={isLoading} type="submit">
        {isLoading ? "Memproses…" : "Masuk sebagai admin"}
      </Button>
      <Button asChild className="w-full" variant="link">
        <Link href="/">Kembali ke chat employee</Link>
      </Button>
    </form>
  );
}
