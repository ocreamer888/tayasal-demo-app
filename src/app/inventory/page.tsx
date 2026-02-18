'use client';

import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/shared/PageHeader';
import { Package } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';


export default function InventoryPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
         
         {/* Desktop Sidebar - hidden on mobile */}
         <Sidebar className="hidden md:flex" />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <Header className="md:hidden" />

        {/* Main Content */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 max-h-screen overflow-x-auto">
              <PageHeader
          title="Inventario"
          description="Gestiona materiales, plantas, equipos y personal"
          icon={Package}
        />
        <InventoryPanel />
      </main>
    </div>
    </div>
  );
}
