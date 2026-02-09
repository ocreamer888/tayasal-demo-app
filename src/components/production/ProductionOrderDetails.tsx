'use client';

import { ProductionOrder } from '@/types/production-order';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  const { user } = useAuth();

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orden de Producción #{order.id.substring(0, 8)}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Creada por {order.created_by_name} • {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Estado</p>
              {getStatusBadge(order.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Fecha de Producción</p>
              <p className="font-semibold">{formatDate(order.production_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Turno</p>
              <p className="font-semibold">{getShiftLabel(order.production_shift)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Planta</p>
              <p className="font-semibold">ID: {order.concrete_plant_id.substring(0, 8)}</p>
            </div>
          </div>

          {/* Production Specs */}
          <Card title="Especificaciones de Producción">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Tipo de Bloque</p>
                <p className="font-semibold text-lg">{order.block_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tamaño</p>
                <p className="font-semibold text-lg">{order.block_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cantidad Producida</p>
                <p className="font-semibold text-lg">{order.quantity_produced.toLocaleString()}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duración</p>
                <p className="font-semibold text-lg">{order.duration_minutes}</p>
                <p className="text-xs text-gray-500">minutos</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Hora Inicio</p>
                  <p className="font-medium">{formatTime(order.start_time) || 'No registrada'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Hora Fin</p>
                  <p className="font-medium">{formatTime(order.end_time) || 'No registrada'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Materials Used */}
          <Card title="Materiales Utilizados">
            {order.materials_used.length === 0 ? (
              <p className="text-gray-500 italic">No hay materiales registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Material</th>
                      <th className="text-right py-2 px-4">Cantidad</th>
                      <th className="text-right py-2 px-4">Costo Unit.</th>
                      <th className="text-right py-2 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.materials_used.map((material, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="py-3 px-4">
                          <p className="font-medium">{material.materialName}</p>
                          <p className="text-sm text-gray-500">{material.unit}</p>
                        </td>
                        <td className="text-right py-3 px-4">{material.quantity}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(material.unitCost)}</td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatCurrency(material.quantity * material.unitCost)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={3} className="text-right py-3 px-4">Total Materiales:</td>
                      <td className="text-right py-3 px-4">{formatCurrency(order.material_cost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Team & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Equipo Asignado">
              {order.team_assigned.length === 0 ? (
                <p className="text-gray-500 italic">No hay equipo asignado</p>
              ) : (
                <div className="space-y-3">
                  {order.team_assigned.map((member, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{member.memberName}</p>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{member.hoursWorked}h × ${member.hourlyRate}/h</p>
                        <p className="text-sm text-gray-500">{formatCurrency(member.hoursWorked * member.hourlyRate)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Mano de Obra:</span>
                      <span className="text-green-600">{formatCurrency(totalLaborCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Equipos Utilizados">
              {order.equipment_used.length === 0 ? (
                <p className="text-gray-500 italic">No hay equipos registrados</p>
              ) : (
                <div className="space-y-3">
                  {order.equipment_used.map((equip, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{equip.equipmentName}</p>
                        <p className="text-sm text-gray-500">{equip.hoursUsed}h × ${equip.hourlyCost}/h</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(equip.hoursUsed * equip.hourlyCost)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Equipos:</span>
                      <span className="text-green-600">{formatCurrency(totalEquipmentCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card title="Desglose de Costos">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Materiales:</span>
                <span className="font-medium">{formatCurrency(order.material_cost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Mano de Obra:</span>
                <span className="font-medium">{formatCurrency(order.labor_cost || totalLaborCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Equipos:</span>
                <span className="font-medium">{formatCurrency(order.equipment_cost || totalEquipmentCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Energía:</span>
                <span className="font-medium">{formatCurrency(order.energy_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Mantenimiento:</span>
                <span className="font-medium">{formatCurrency(order.maintenance_cost || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4 mt-4">
                <span className="font-bold text-lg">Costo Total:</span>
                <span className="font-bold text-xl text-green-600">{formatCurrency(order.total_cost)}</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card title="Notas">
              <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            {onEdit && (order.status === 'draft' || user?.user_metadata?.role === 'engineer') && (
              <Button variant="secondary" onClick={() => onEdit(order)}>
                Editar
              </Button>
            )}

            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
