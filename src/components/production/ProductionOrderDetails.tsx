'use client';

import { ProductionOrder } from '@/types/production-order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  XCircle,
  CheckCircle,
  Clock,
  Calendar,
  Users,
  Wrench
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

interface ProductionOrderDetailsProps {
  order: ProductionOrder;
  onClose: () => void;
  onEdit?: (order: ProductionOrder) => void;
  onUpdateStatus?: (id: string, status: ProductionOrder['status']) => void;
}

export function ProductionOrderDetails({ order, onClose, onEdit, onUpdateStatus }: ProductionOrderDetailsProps) {
  const { profile } = useAuth();
  const userRole = profile?.role || 'operator';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      morning: 'Mañana (7am - 3pm)',
      afternoon: 'Tarde (3pm - 11pm)',
      night: 'Noche (11pm - 7am)',
    };
    return labels[shift] || shift;
  };

  const totalLaborCost = order.team_assigned.reduce((sum, member) => sum + (member.hoursWorked * member.hourlyRate), 0);
  const totalEquipmentCost = order.equipment_used.reduce((sum, eq) => sum + (eq.hoursUsed * eq.hourlyCost), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-white sticky top-0">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Orden de Producción #{order.id.substring(0, 8)}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Creada por {order.created_by_name} • {formatDate(order.createdAt)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <XCircle size={24} className="text-neutral-500" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-500">Estado</p>
              {getStatusBadge(order.status)}
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-500">Fecha de Producción</p>
              <p className="font-semibold text-neutral-900">{formatDate(order.production_date)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-500">Turno</p>
              <p className="font-semibold text-neutral-900">{getShiftLabel(order.production_shift)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-500">Planta</p>
              <p className="font-semibold text-neutral-900">ID: {order.concrete_plant_id.substring(0, 8)}</p>
            </div>
          </div>

          {/* Production Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900">Especificaciones de Producción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-neutral-500">Tipo de Bloque</p>
                  <p className="text-lg font-bold text-neutral-900">{order.block_type}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Tamaño</p>
                  <p className="text-lg font-bold text-neutral-900">{order.block_size}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Cantidad Producida</p>
                  <p className="text-lg font-bold text-neutral-900">{order.quantity_produced.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">unidades</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Duración</p>
                  <p className="text-lg font-bold text-neutral-900">{order.duration_minutes}</p>
                  <p className="text-xs text-neutral-500">minutos</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Calendar className="text-neutral-400" size={20} />
                  <div>
                    <p className="text-sm text-neutral-500">Hora Inicio</p>
                    <p className="font-medium text-neutral-900">{formatTime(order.start_time) || 'No registrada'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="text-neutral-400" size={20} />
                  <div>
                    <p className="text-sm text-neutral-500">Hora Fin</p>
                    <p className="font-medium text-neutral-900">{formatTime(order.end_time) || 'No registrada'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials Used */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900">Materiales Utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              {order.materials_used.length === 0 ? (
                <p className="italic text-neutral-500">No hay materiales registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="py-2 px-4 text-left text-sm font-semibold text-neutral-600">Material</th>
                        <th className="py-2 px-4 text-right text-sm font-semibold text-neutral-600">Cantidad</th>
                        {userRole !== 'operator' && <th className="py-2 px-4 text-right text-sm font-semibold text-neutral-600">Costo Unit.</th>}
                        {userRole !== 'operator' && <th className="py-2 px-4 text-right text-sm font-semibold text-neutral-600">Subtotal</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.materials_used.map((material, idx) => (
                        <tr key={idx} className="border-b border-neutral-100 last:border-b-0">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-neutral-900">{material.materialName}</p>
                            <p className="text-sm text-neutral-500">{material.unit}</p>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-neutral-700">{material.quantity}</td>
                          {userRole !== 'operator' && (
                            <>
                              <td className="py-3 px-4 text-right tabular-nums text-neutral-700">{formatCurrency(material.unitCost)}</td>
                              <td className="py-3 px-4 text-right tabular-nums font-semibold text-neutral-900">
                                {formatCurrency(material.quantity * material.unitCost)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {userRole !== 'operator' && (
                        <tr className="bg-neutral-50 font-bold">
                          <td colSpan={4} className="py-3 px-4 text-right text-neutral-700">Total Materiales:</td>
                          <td className="py-3 px-4 text-right tabular-nums text-green-600">{formatCurrency(order.material_cost)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team & Equipment */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 text-neutral-900">Equipo Asignado</CardTitle>
              </CardHeader>
              <CardContent>
                {order.team_assigned.length === 0 ? (
                  <p className="italic text-neutral-500">No hay equipo asignado</p>
                ) : (
                  <div className="space-y-3">
                    {order.team_assigned.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-b-0">
                        <div>
                          <p className="font-semibold text-neutral-900">{member.memberName}</p>
                          <p className="text-sm text-neutral-500">{member.role}</p>
                        </div>
                        {userRole !== 'operator' && (
                          <div className="text-right">
                            <p className="font-medium tabular-nums text-neutral-900">{member.hoursWorked}h × ${member.hourlyRate}/h</p>
                            <p className="text-sm text-neutral-500">{formatCurrency(member.hoursWorked * member.hourlyRate)}</p>
                          </div>
                        )}
                        {userRole === 'operator' && (
                          <div className="text-right">
                            <p className="font-medium tabular-nums text-neutral-900">{member.hoursWorked}h</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {userRole !== 'operator' && (
                      <div className="border-t border-neutral-200 pt-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-neutral-700">Total Mano de Obra:</span>
                          <span className="text-green-600">{formatCurrency(totalLaborCost)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h3 text-neutral-900">Equipos Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                {order.equipment_used.length === 0 ? (
                  <p className="italic text-neutral-500">No hay equipos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {order.equipment_used.map((equip, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-b-0">
                        <div>
                          <p className="font-semibold text-neutral-900">{equip.equipmentName}</p>
                          {userRole !== 'operator' && (
                            <p className="text-sm text-neutral-500">{equip.hoursUsed}h × ${equip.hourlyCost}/h</p>
                          )}
                        </div>
                        <div className="text-right">
                          {userRole !== 'operator' ? (
                            <p className="font-medium tabular-nums text-neutral-900">{formatCurrency(equip.hoursUsed * equip.hourlyCost)}</p>
                          ) : (
                            <p className="font-medium tabular-nums text-neutral-900">{equip.hoursUsed}h</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {userRole !== 'operator' && (
                      <div className="border-t border-neutral-200 pt-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-neutral-700">Total Equipos:</span>
                          <span className="text-green-600">{formatCurrency(totalEquipmentCost)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          {(userRole === 'engineer' || userRole === 'admin') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 text-neutral-900">Desglose de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 py-2">
                    <span className="text-neutral-600">Materiales:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(order.material_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 py-2">
                    <span className="text-neutral-600">Mano de Obra:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(order.labor_cost || totalLaborCost)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 py-2">
                    <span className="text-neutral-600">Equipos:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(order.equipment_cost || totalEquipmentCost)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 py-2">
                    <span className="text-neutral-600">Energía:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(order.energy_cost || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 py-2">
                    <span className="text-neutral-600">Mantenimiento:</span>
                    <span className="font-medium text-neutral-900">{formatCurrency(order.maintenance_cost || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-4 mt-4">
                    <span className="text-lg font-bold text-neutral-900">Costo Total:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(order.total_cost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-h3 text-neutral-900">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t border-neutral-200 pt-4">
            {onEdit && (order.status === 'draft' || userRole === 'engineer' || userRole === 'admin') && (
              <Button variant="secondary" onClick={() => onEdit(order)}>
                Editar
              </Button>
            )}
            <Button variant="default" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
