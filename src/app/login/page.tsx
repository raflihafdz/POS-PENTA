"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect based on role - we'll check after login
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        
        if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/kasir");
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-linear-to-br from-rose-400 via-rose-500 to-rose-600 p-4 overflow-hidden fixed inset-0">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/logo_penta.png"
              alt="POS PENTA Logo"
              width={96}
              height={96}
              priority
              className="object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
            POS PENTA
          </CardTitle>
          <p className="text-gray-900 mt-2">Silakan login untuk melanjutkan</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Masuk
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-900">
            <p>Waktunya Bekerja</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
