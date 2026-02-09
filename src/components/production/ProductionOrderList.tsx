'use client';

import { useState } from 'react';
import { ProductionOrder } from '@/types/production-order';
import { Button } from '@/components/ui/Button';
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ProductionOrderListProps {
  orders: ProductionOrder[];
  loading?: boolean;
  onView: (order: ProductionOrder) => void;
  onEdit: (order: ProductionOrder) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionOrder['status']) => void;
  userRole: 'operator' | 'engineer' | 'admin';
}

export function ProductionOrderList({
  orders,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  userRole
}: ProductionOrderListProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const getStatusBadge = (status: ProductionOrder['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-blue-100 text-blue-800',
    };

    const labels = {
      draft: 'Borrador',
      submitted: 'Enviada',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      archived: 'Archivada',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      morning: 'Mañana',
      afternoon: 'Tarde',
      night: 'Noche',
    };
    return labels[shift] || shift;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta orden de producción? Esta acción no se puede deshacer.')) {
      onDelete(id);
    }
  };

  const canEdit = (order: ProductionOrder) => {
    if (userRole === 'engineer' || userRole === 'admin') return true;
    // Operators can only edit their own draft orders
    return order.status === 'draft';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando órdenes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <FileText size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {userRole === 'operator' ? 'No tienes órdenes de producción' : 'No hay órdenes registradas'}
        </h3>
        <p className="text-gray-500 mb-6">
          {userRole === 'operator'
            ? 'Crea tu primera orden para registrar producción de bloques de concreto.'
            : 'Las órdenes de producción aparecerán aquí cuando el personal las cree.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo / Tamaño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha / Turno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id.substring(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.block_type}</div>
                  <div className="text-xs text-gray-500">{order.block_size}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.quantity_produced.toLocaleString()} unidades
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(order.production_date)}</div>
                  <div className="text-xs text-gray-500">{getShiftLabel(order.production_shift)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(order.total_cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(order)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>

                    {canEdit(order) && (
                      <button
                        onClick={() => onEdit(order)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                    )}

                    {userRole === 'engineer' || userRole === 'admin' ? (
                      <>
                        {order.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'approved')}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Aprobar"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'rejected')}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Rechazar"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {order.status === 'draft' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'submitted')}
                            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="Enviar a revisión"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                      </>
                    ) : null}

                    {order.status === 'draft' && canEdit(order) && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
