'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import zxcvbn from 'zxcvbn';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'operator' | 'engineer'>('operator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Password strength calculation using zxcvbn
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, feedback: { warning: '', suggestions: [] } };
    return zxcvbn(password);
  }, [password]);

  const strengthLevel = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][passwordStrength.score];
  const strengthColor = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-emerald-500'
  ][passwordStrength.score];

  const minScore = 3; // Require at least "Fuerte"

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Enforce password strength (minimum score 3 = "Fuerte")
    if (passwordStrength.score < minScore) {
      setError('La contraseña es demasiado débil. Por favor, usa una contraseña más segura.');
      return;
    }

    // Additional explicit requirements
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      // If immediate login (email confirmation disabled), set session
      if (data.session) {
        await supabase.auth.setSession(data.session);
        router.push('/dashboard');
        router.refresh();
      } else {
        // Email confirmation required
        alert('¡Cuenta creada exitosamente! Por favor verifica tu correo electrónico.');
        router.push('/login');
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-t from-green-900 to-green-800 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center w-full">
          <CardTitle className="text-2xl font-bold text-neutral-900">
            Crear Cuenta
          </CardTitle>
          <p className="mt-2 text-sm text-neutral-500">
            Regístrate para usar el Sistema de Producción
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-neutral-700">
                Nombre Completo <span className="text-red-900">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Juan Pérez González"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                Correo electrónico <span className="text-red-900">*</span>
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
              <Label htmlFor="role" className="text-sm font-medium text-neutral-700">
                Rol en el Sistema <span className="text-red-900">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'operator' | 'engineer')}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Personal Operativo</SelectItem>
                  <SelectItem value="engineer">Ingeniero / Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500 mt-1">
                {role === 'operator'
                  ? 'Puede crear y ver sus propias órdenes de producción'
                  : 'Puede ver todas las órdenes, aprobar/rechazar, y acceder a reportes'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                Contraseña <span className="text-red-900">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-neutral-900">Mínimo 12 caracteres</p>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-3 space-y-2">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${strengthColor} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score >= 3 ? 'text-green-600' :
                      passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {strengthLevel}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${password.length >= 12 ? 'text-green-600' : 'text-neutral-500'}`}>
                      {password.length >= 12 ? '✓' : '○'} Al menos 12 caracteres
                    </div>
                    <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-neutral-500'}`}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} Al menos una mayúscula
                    </div>
                    <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-neutral-500'}`}>
                      {/[a-z]/.test(password) ? '✓' : '○'} Al menos una minúscula
                    </div>
                    <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-neutral-500'}`}>
                      {/[0-9]/.test(password) ? '✓' : '○'} Al menos un número
                    </div>
                    <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-neutral-500'}`}>
                      {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Al menos un carácter especial
                    </div>
                  </div>

                  {/* Feedback from zxcvbn */}
                  {passwordStrength.feedback?.suggestions && passwordStrength.feedback.suggestions.length > 0 && (
                    <p className="text-xs text-neutral-500 italic">
                      {passwordStrength.feedback.suggestions[0]}
                    </p>
                  )}
                  {passwordStrength.feedback?.warning && (
                    <p className="text-xs text-yellow-600 italic">
                      {passwordStrength.feedback.warning}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                Confirmar Contraseña <span className="text-red-900">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-200">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="font-medium text-green-900 hover:text-green-600">
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
