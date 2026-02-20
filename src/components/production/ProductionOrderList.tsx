'use client';

import { ProductionOrder } from '@/types/production-order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const getStatusBadge = (status: ProductionOrder['status']) => {
    const variant =
      status === 'approved'
        ? 'success'
        : status === 'submitted'
        ? 'warning'
        : status === 'rejected'
        ? 'error'
        : 'secondary';

    const labels = {
      draft: 'Borrador',
      submitted: 'Enviada',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      archived: 'Archivada',
    };

    return <Badge variant={variant}>{labels[status]}</Badge>;
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
    return new Intl.NumberFormat('es-CL', {
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
      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo / Tamaño</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Fecha / Turno</TableHead>
                <TableHead>Estado</TableHead>
                {userRole !== 'operator' && <TableHead>Costo Total</TableHead>}
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  {userRole !== 'operator' && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText size={64} className="mx-auto mb-4 text-neutral-300" />
        <h3 className="mb-2 text-lg font-semibold text-neutral-700">
          {userRole === 'operator' ? 'No tienes órdenes de producción' : 'No hay órdenes registradas'}
        </h3>
        <p className="text-neutral-500">
          {userRole === 'operator'
            ? 'Crea tu primera orden para registrar producción de bloques de concreto.'
            : 'Las órdenes de producción aparecerán aquí cuando el personal las cree.'
          }
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo / Tamaño</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Fecha / Turno</TableHead>
              <TableHead>Estado</TableHead>
              {userRole !== 'operator' && <TableHead>Costo Total</TableHead>}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono font-medium text-neutral-900">
                  #{order.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-neutral-900">{order.block_type}</div>
                  <div className="text-xs text-neutral-500">{order.block_size}</div>
                </TableCell>
                <TableCell className="tabular-nuns font-semibold text-neutral-700">
                  {order.quantity_produced.toLocaleString()} unidades
                </TableCell>
                <TableCell>
                  <div className="text-sm text-neutral-900">{formatDate(order.production_date)}</div>
                  <div className="text-xs text-neutral-500">{getShiftLabel(order.production_shift)}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
                {userRole !== 'operator' && (
                  <TableCell className="font-semibold tabular-nums text-neutral-900">
                    {formatCurrency(order.total_cost)}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onView(order)}
                      aria-label="Ver detalles de la orden"
                    >
                      <Eye size={16} />
                    </Button>

                    {canEdit(order) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(order)}
                        aria-label="Editar orden"
                      >
                        <Edit size={16} />
                      </Button>
                    )}

                    {userRole === 'engineer' || userRole === 'admin' ? (
                      <>
                        {order.status === 'submitted' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onUpdateStatus(order.id, 'approved')}
                              aria-label="Aprobar orden"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onUpdateStatus(order.id, 'rejected')}
                              aria-label="Rechazar orden"
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {order.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onUpdateStatus(order.id, 'submitted')}
                            aria-label="Enviar a revisión"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <Clock size={16} />
                          </Button>
                        )}
                      </>
                    ) : null}

                    {order.status === 'draft' && canEdit(order) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(order.id)}
                        aria-label="Eliminar orden"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
