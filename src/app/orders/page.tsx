'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProductionOrders } from '@/lib/hooks/useProductionOrders';
import { ProductionOrderList } from '@/components/production/ProductionOrderList';
import { ProductionOrderForm } from '@/components/production/ProductionOrderForm';
import { ProductionOrderDetails } from '@/components/production/ProductionOrderDetails';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Search, Filter } from 'lucide-react';

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

  const handleSubmit = async (orderData: any) => {
    if (editingOrder) {
      await updateOrder(editingOrder.id, orderData);
    } else {
      await addOrder(orderData);
    }
    setShowForm(false);
    setEditingOrder(null);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Órdenes de Producción</h1>
              <p className="text-sm text-gray-500">
                {userRole === 'operator' || userRole === 'engineer' || userRole === 'admin'
                  ? 'Gestiona tus órdenes de producción'
                  : 'Administrador - Todas las órdenes'}
              </p>
            </div>
            <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} variant="primary">
              <Plus size={18} className="mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {!showForm && (
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar órdenes por tipo, tamaño..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getStatusOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Ordenar por: Fecha</option>
                  <option value="type">Tipo de Bloque</option>
                  <option value="quantity">Cantidad</option>
                  <option value="cost">Costo</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Form or List */}
        {showForm ? (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
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
            <div className="mb-4 text-sm text-gray-600">
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </div>
            <ProductionOrderList
              orders={filteredOrders}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={deleteOrder}
              onUpdateStatus={updateOrderStatus}
              userRole={userRole}
            />
          </>
        )}
      </main>

      {/* Order Details Modal */}
      {viewingOrder && (
        <ProductionOrderDetails
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onEdit={userRole === 'engineer' ? handleEdit : undefined}
          onUpdateStatus={userRole === 'engineer' ? updateOrderStatus : undefined}
        />
      )}
    </div>
  );
}
