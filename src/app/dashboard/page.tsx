'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { ProductionDashboard } from '@/components/dashboard/ProductionDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/shared/PageHeader';
import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const userRole = (profile?.role || user?.user_metadata?.role) as 'operator' | 'engineer' | 'admin' || 'operator';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-green-900 to-green-800 flex">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar className="hidden md:flex" />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <Header className="md:hidden" />

        {/* Main Content */}
        <main className="flex-1 mx-auto w-full max-w-9xl py-8 px-4 max-h-screen overflow-y-auto">
          <PageHeader
            title="Dashboard"
            description={
              userRole === 'engineer' || userRole === 'admin'
                ? 'Panel de control de ingeniero'
                : 'Panel de producción'
            }
            icon={BarChart3}
          />
          <ProductionDashboard userRole={userRole} />
        </main>
      </div>
    </div>
  );
}
