'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials';
import { useConcretePlants } from '@/lib/hooks/useConcretePlants';
import { useEquipment } from '@/lib/hooks/useEquipment';
import { useTeamMembers } from '@/lib/hooks/useTeamMembers';
import { useAuth } from '@/app/contexts/AuthContext';
import { Plus, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MaterialDialog } from './dialogs/MaterialDialog';
import { PlantDialog } from './dialogs/PlantDialog';
import { EquipmentDialog } from './dialogs/EquipmentDialog';
import { TeamDialog } from './dialogs/TeamDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

type TabType = 'materials' | 'plants' | 'equipment' | 'team';

export function InventoryPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isPlantDialogOpen, setIsPlantDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

  const { profile } = useAuth();
  const userRole = (profile?.role as 'operator' | 'engineer' | 'admin') || 'operator';

  const {
    filteredMaterials,
    loading: materialsLoading,
    addMaterial,
  } = useInventoryMaterials({ userRole });

  const {
    plants,
    loading: plantsLoading,
    addPlant,
  } = useConcretePlants({ userRole });

  const {
    equipment,
    loading: equipmentLoading,
    addEquipment,
  } = useEquipment();

  const {
    members,
    loading: teamLoading,
    addMember,
  } = useTeamMembers();

  const tabs = [
    { id: 'materials' as TabType, label: 'Materiales', icon: Package },
    { id: 'plants' as TabType, label: 'Plantas', icon: Package },
    { id: 'equipment' as TabType, label: 'Equipos', icon: Package },
    { id: 'team' as TabType, label: 'Equipo', icon: Package },
  ];

  // Stock status uses Badge variants
  const getStockStatusVariant = (quantity: number, minQuantity: number): 'success' | 'warning' | 'error' => {
    if (quantity === 0) return 'error';
    if (quantity <= minQuantity) return 'warning';
    return 'success';
  };

  const getEquipmentStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'secondary' => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'retired': return 'error';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 w-full overflow-x-auto">
      {/* Tabs */}
      <Tabs defaultValue="materials" value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-4 bg-neutral-600/80 text-neutral-100 rounded-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center justify-center rounded-full gap-2 data-[state=active]:bg-neutral-800! data-[state=inactive]:bg-neutral-800/30 data-[state=inactive]:text-neutral-400! data-[state=active]:shadow-sm"
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-6">
          <Card className="p-4">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between overflow-x-auto w-full">
                <CardTitle className="text-h3 text-neutral-100">Inventario de Materiales</CardTitle>
                <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus size={16} className="mr-2" />
                      Agregar Material
                    </Button>
                  </DialogTrigger>
                  <MaterialDialog
                    open={isMaterialDialogOpen}
                    onOpenChange={setIsMaterialDialogOpen}
                    onSubmit={async (materialData) => {
                      await addMaterial(materialData);
                      // No need to refetch - real-time will update
                    }} />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {materialsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  No hay materiales registrados
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 w-full overflow-x-auto">
                  <Table className='overflow-hidden w-full'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Material</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Categoría</TableHead>
                        <TableHead className="text-right whitespace-normal sm:whitespace-nowrap">Cantidad</TableHead>
                        <TableHead className="text-right whitespace-normal sm:whitespace-nowrap">Mínimo</TableHead>
                        <TableHead className="text-right whitespace-normal sm:whitespace-nowrap">Costo Unit.</TableHead>
                        <TableHead className="text-right whitespace-normal sm:whitespace-nowrap">Total</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Estado</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Ubicación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material) => {
                        const statusVariant = getStockStatusVariant(material.current_quantity, material.min_stock_quantity);
                        const totalValue = material.current_quantity * material.unit_cost;
                        return (
                          <TableRow key={material.id}>
                            <TableCell className="whitespace-normal sm:whitespace-nowrap">
                              <div>
                                <p className="font-semibold text-neutral-200">{material.material_name}</p>
                                <p className="text-sm text-neutral-500">{material.unit}</p>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize text-neutral-700 whitespace-normal sm:whitespace-nowrap">
                              {material.category}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-neutral-900 whitespace-normal sm:whitespace-nowrap">
                              {material.current_quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-neutral-500 tabular-nums whitespace-normal sm:whitespace-nowrap">
                              {material.min_stock_quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-neutral-700 whitespace-normal sm:whitespace-nowrap">
                              ${material.unit_cost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-neutral-900 whitespace-normal sm:whitespace-nowrap">
                              ${totalValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="whitespace-normal sm:whitespace-nowrap">
                              <Badge variant={statusVariant}>
                                {statusVariant === 'success' ? 'Disponible' : statusVariant === 'warning' ? 'Stock Bajo' : 'Sin Stock'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-neutral-500 whitespace-normal sm:whitespace-nowrap">{material.location || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plants Tab */}
        <TabsContent value="plants" className="mt-6">
          <Card className="p-6">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3 text-neutral-200">Plantas de Concreto</CardTitle>
                <Dialog open={isPlantDialogOpen} onOpenChange={setIsPlantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus size={16} className="mr-2" />
                      Agregar Planta
                    </Button>
                  </DialogTrigger>
                  <PlantDialog
                    open={isPlantDialogOpen}
                    onOpenChange={setIsPlantDialogOpen}
                    onSubmit={async (plantData) => {
                      await addPlant(plantData);
                    }}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="w-full
            ">
              {plantsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : plants.length === 0 ? (
                <div className="py-12 text-center text-neutral-200">
                  No hay plantas registradas
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plants.map((plant) => (
                    <Card key={plant.id} className="p-4">
                      <div className="space-y-3">
                        <h4 className="text-lg font-bold text-neutral-200">{plant.name}</h4>
                        <p className="text-sm text-neutral-500">{plant.location}</p>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-neutral-400" />
                          <p className="text-sm text-neutral-400">
                            Capacidad: <span className="font-semibold">{plant.capacity_per_hour}</span> m³/h
                          </p>
                        </div>
                        <Badge variant={plant.is_active ? 'success' : 'secondary'}>
                          {plant.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6">
          <Card className="p-6">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3 text-neutral-200">Equipos</CardTitle>
                <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus size={16} className="mr-2" />
                      Agregar Equipo
                    </Button>
                  </DialogTrigger>
                  <EquipmentDialog
                    open={isEquipmentDialogOpen}
                    onOpenChange={setIsEquipmentDialogOpen}
                    onSubmit={async (equipmentData) => {
                      await addEquipment(equipmentData);
                    }}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {equipmentLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : equipment.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  No hay equipos registrados
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Nombre</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Modelo</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Serial</TableHead>
                        <TableHead className="text-right whitespace-normal sm:whitespace-nowrap">Costo/hora</TableHead>
                        <TableHead className="whitespace-normal sm:whitespace-nowrap">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.map((eq) => (
                        <TableRow key={eq.id}>
                          <TableCell className="font-semibold text-neutral-900 whitespace-normal sm:whitespace-nowrap">{eq.name}</TableCell>
                          <TableCell className="text-neutral-500">{eq.model || '-'}</TableCell>
                          <TableCell className="font-mono text-neutral-500">{eq.serial_number || '-'}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-neutral-900">
                            ${eq.hourly_cost.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEquipmentStatusVariant(eq.status)}>
                              {eq.status === 'active' ? 'Activo' : eq.status === 'maintenance' ? 'Mantenimiento' : 'Retirado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6">
          <Card className="p-6">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3 text-neutral-200">Equipo de Trabajo</CardTitle>
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus size={16} className="mr-2" />
                      Agregar Miembro
                    </Button>
                  </DialogTrigger>
                  <TeamDialog
                    open={isTeamDialogOpen}
                    onOpenChange={setIsTeamDialogOpen}
                    onSubmit={async (memberData) => {
                      await addMember(memberData);
                    }}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {teamLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  No hay miembros registrados
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Tarifa/hora</TableHead>
                        <TableHead>Teléfono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-semibold text-neutral-900">{member.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{member.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums text-neutral-900">
                            ${member.hourly_rate.toFixed(2)}/h
                          </TableCell>
                          <TableCell className="text-neutral-500">{member.contact_phone || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
