'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingUp, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('🔧 HomePage: render. loading=', loading, 'user=', user?.email || 'null');

  useEffect(() => {
    console.log('🔧 HomePage: useEffect triggered. loading=', loading, 'user=', user?.email || 'null');
    if (!loading) {
      console.log('🔧 HomePage: loading=false, performing redirect. user?', !!user);
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) {
    console.log('🔧 HomePage: RETURNING SPINNER (loading=true)');
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-green-500" />
          <p className="text-neutral-500">Cargando...</p>
        </div>
      </div>
    );
  }

  console.log('🔧 HomePage: RETURNING LANDING PAGE (loading=false)');

  // This will briefly show while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-green-500 to-green-600 shadow-lg">
            <Package size={40} className="text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">
            Sistema de Producción de Bloques
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-600">
            Gestión integral de producción, inventario y órdenes para plantas de bloques de concreto.
            Diseñado para eficiencia operativa y control total.
          </p>

          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <TrendingUp size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900"> Producción Optimizada</h3>
              <p className="text-neutral-600">
                Control total de órdenes, costos y recursos de producción.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <BarChart3 size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">Reportes en Tiempo Real</h3>
              <p className="text-neutral-600">
                Dashboards interactivos con métricas clave de rendimiento.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Shield size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">Seguridad y Control</h3>
              <p className="text-neutral-600">
                Sistema de roles y permisos para acceso seguro.
              </p>
            </Card>
          </div>

          <Button size="lg" className="px-8" onClick={() => router.push('/login')}>
            Comenzar Ahora
          </Button>
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Sistema de Producción de Bloques Premium. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
