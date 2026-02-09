'use client';

import { useState } from 'react';
import { InventoryMaterial, ConcretePlant, Equipment, TeamMember } from '@/types/inventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials';
import { useConcretePlants } from '@/lib/hooks/useConcretePlants';
import { useEquipment } from '@/lib/hooks/useEquipment';
import { useTeamMembers } from '@/lib/hooks/useTeamMembers';
import { Plus, AlertTriangle, Package } from 'lucide-react';

type TabType = 'materials' | 'plants' | 'equipment' | 'team';

export function InventoryPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  const {
    materials: inventoryMaterials,
    filteredMaterials,
    loading: materialsLoading,
    addMaterial,
    updateMaterial,
    updateStock,
  } = useInventoryMaterials({ userRole: 'engineer' });

  const {
    plants,
    loading: plantsLoading,
    addPlant,
    updatePlant,
    deletePlant,
  } = useConcretePlants();

  const {
    equipment,
    loading: equipmentLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipment();

  const {
    members,
    loading: teamLoading,
    addMember,
    updateMember,
    deleteMember,
  } = useTeamMembers();

  const tabs = [
    { id: 'materials' as TabType, label: 'Materiales', icon: Package },
    { id: 'plants' as TabType, label: 'Plantas', icon: Package },
    { id: 'equipment' as TabType, label: 'Equipos', icon: Package },
    { id: 'team' as TabType, label: 'Equipo', icon: Package },
  ];

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return { label: 'Sin Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (quantity <= minQuantity) return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: 'Disponible', color: 'bg-green-100 text-green-800', icon: Package };
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Inventario de Materiales</h3>
              <Button size="sm" variant="primary">
                <Plus size={16} className="mr-2" />
                Agregar Material
              </Button>
            </div>

            {materialsLoading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay materiales registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMaterials.map((material) => {
                      const status = getStockStatus(material.current_quantity, material.min_stock_quantity);
                      return (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{material.material_name}</p>
                              <p className="text-sm text-gray-500">{material.unit}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap capitalize">
                            {material.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                            {material.current_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                            {material.min_stock_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            ${material.unit_cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                            ${(material.current_quantity * material.unit_cost).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.location}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Plants Tab */}
      {activeTab === 'plants' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Plantas de Concreto</h3>
              <Button size="sm" variant="primary">
                <Plus size={16} className="mr-2" />
                Agregar Planta
              </Button>
            </div>

            {plantsLoading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : plants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay plantas registradas
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.map((plant) => (
                  <div key={plant.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg">{plant.name}</h4>
                    <p className="text-gray-500 mb-2">{plant.location}</p>
                    <p className="text-sm text-gray-600">
                      Capacidad: {plant.capacity_per_hour} m³/h
                    </p>
                    <p className="text-sm mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plant.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Equipos</h3>
              <Button size="sm" variant="primary">
                <Plus size={16} className="mr-2" />
                Agregar Equipo
              </Button>
            </div>

            {equipmentLoading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay equipos registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo/hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {equipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{eq.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{eq.model || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{eq.serial_number || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          ${eq.hourly_cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eq.status === 'active' ? 'bg-green-100 text-green-800' : eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {eq.status === 'active' ? 'Activo' : eq.status === 'maintenance' ? 'Mantenimiento' : 'Retirado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Equipo de Trabajo</h3>
              <Button size="sm" variant="primary">
                <Plus size={16} className="mr-2" />
                Agregar Miembro
              </Button>
            </div>

            {teamLoading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay miembros registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tarifa/hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          ${member.hourly_rate.toFixed(2)}/h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {member.contact_phone || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
