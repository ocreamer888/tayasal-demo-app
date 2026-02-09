'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { ProductionDashboard } from '@/components/dashboard/ProductionDashboard';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = profile?.role || 'operator';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Producción</h1>
              <p className="text-sm text-gray-500">
                {userRole === 'engineer' || userRole === 'admin'
                  ? 'Panel de Ingeniero'
                  : 'Panel de Producción'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.company_name || 'Sin empresa'}
                </p>
                <p className="text-xs text-gray-500">
                  Rol: {userRole === 'engineer' || userRole === 'admin' ? 'Ingeniero' : 'Operario'}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionDashboard />
      </main>
    </div>
  );
}
