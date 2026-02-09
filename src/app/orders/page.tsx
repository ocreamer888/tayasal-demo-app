'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProductionOrders } from '@/lib/hooks/useProductionOrders';
import { toast } from 'sonner';
import { ProductionOrderList } from '@/components/production/ProductionOrderList';
import { ProductionOrderForm } from '@/components/production/ProductionOrderForm';
import { ProductionOrderDetails } from '@/components/production/ProductionOrderDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { ProductionOrder } from '@/types/production-order';

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const userRole = (profile?.role as 'operator' | 'engineer' | 'admin') || 'operator';

  const {
    orders,
    filteredOrders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    loading,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
  } = useProductionOrders({ userRole });

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      try {
        await deleteOrder(id);
        toast.success('Orden eliminada exitosamente');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Error al eliminar la orden'
        );
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: ProductionOrder['status']) => {
    try {
      await updateOrderStatus(id, status);
      const statusMessages = {
        approved: 'Orden aprobada exitosamente',
        rejected: 'Orden rechazada',
        submitted: 'Orden enviada a revisión',
        draft: 'Orden guardada como borrador',
        archived: 'Orden archivada',
      };
      toast.success(statusMessages[status] || `Estado actualizado a ${status}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar el estado de la orden'
      );
      throw error;
    }
  };

  const handleSubmit = async (orderData: any) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
      } else {
        await addOrder(orderData);
      }
      toast.success(
        editingOrder ? 'Orden actualizada exitosamente' : 'Orden creada exitosamente'
      );
      setShowForm(false);
      setEditingOrder(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar la orden'
      );
    }
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleView = (order: any) => {
    setViewingOrder(order);
  };

  const getStatusOptions = () => {
    const statuses = [
      { value: 'all', label: 'Todos' },
      { value: 'draft', label: 'Borrador' },
      { value: 'submitted', label: 'Enviada' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'rejected', label: 'Rechazada' },
      { value: 'archived', label: 'Archivada' },
    ];
    return statuses;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Órdenes de Producción"
          description="Gestiona tus órdenes de producción"
          icon={ClipboardList}
          actions={
            <Button onClick={() => { setEditingOrder(null); setShowForm(true); }}>
              <Plus size={18} className="mr-2" />
              Nueva Orden
            </Button>
          }
        />

        {!showForm && (
          <Card className="mb-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    placeholder="Buscar órdenes por tipo, tamaño..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por: Fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ordenar por: Fecha</SelectItem>
                    <SelectItem value="type">Tipo de Bloque</SelectItem>
                    <SelectItem value="quantity">Cantidad</SelectItem>
                    <SelectItem value="cost">Costo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {showForm ? (
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingOrder ? 'Editar Orden de Producción' : 'Nueva Orden de Producción'}
              </h2>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingOrder(null); }}>
                Cancelar
              </Button>
            </div>
            <ProductionOrderForm
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingOrder(null); }}
              initialData={editingOrder}
            />
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-neutral-500">
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </div>
            <ProductionOrderList
              orders={filteredOrders}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
              userRole={userRole}
            />
          </>
        )}

        {/* Order Details Modal */}
        {viewingOrder && (
          <ProductionOrderDetails
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
            onEdit={userRole === 'engineer' ? handleEdit : undefined}
            onUpdateStatus={userRole === 'engineer' ? handleUpdateStatus : undefined}
          />
        )}
      </main>
    </div>
  );
}
