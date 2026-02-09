'use client';

import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/shared/PageHeader';
import { Package } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Inventario"
          description="Gestiona materiales, plantas, equipos y personal"
          icon={Package}
        />
        <InventoryPanel />
      </main>
    </div>
  );
}
