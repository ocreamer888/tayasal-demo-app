'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { FormEvent } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth(); // Get auth state from context
  const router = useRouter();

  // Navigate when user becomes available
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Session is set via HttpOnly cookie by the server. Call refreshSession()
      // to sync the cookie with the browser client and trigger onAuthStateChange
      // in AuthContext, which will then trigger navigation via the useEffect above.
      await supabase.auth.refreshSession();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      console.warn('Login failed:', { email, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row min-h-screen items-center justify-center bg-gradient-to-t from-green-900 to-green-800 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl aspect-square flex flex-col justify-center items-center">
        <CardHeader className="text-center w-full">
          <CardTitle className="text-2xl font-bold text-neutral-100">
            Sistema de Producción
          </CardTitle>
          <p className="mt-2 text-sm text-neutral-500">
            Gestión de Órdenes de Producción de Bloques
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-neutral-900">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-200">
              ¿No tienes cuenta?{' '}
              <a href="/signup" className="font-medium text-green-500 hover:text-green-600">
                Regístrate aquí
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
