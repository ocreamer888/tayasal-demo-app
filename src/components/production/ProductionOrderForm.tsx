'use client';

import { useState, useEffect } from 'react';
import {
  ProductionOrder,
  ProductionOrderFormData,
  MaterialUsage,
  EquipmentUsage,
  TeamAssignment
} from '@/types/production-order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials';
import { useConcretePlants } from '@/lib/hooks/useConcretePlants';
import { useEquipment } from '@/lib/hooks/useEquipment';
import { useTeamMembers } from '@/lib/hooks/useTeamMembers';
import {
  SHIFT_OPTIONS,
  BLOCK_TYPES,
  BLOCK_SIZES
} from '@/lib/constants/production';
import { Plus, Trash2, Calculator } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

interface ProductionOrderFormProps {
  onSubmit: (data: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'user_id' | 'created_by_name'>) => void;
  onCancel: () => void;
  initialData?: ProductionOrder | null;
}

export function ProductionOrderForm({ onSubmit, onCancel, initialData }: ProductionOrderFormProps) {
  
  const { materials } = useInventoryMaterials({ userRole: 'engineer' });
  const { plants } = useConcretePlants();
  const { equipment: allEquipment } = useEquipment();
  const { members } = useTeamMembers();

  const [formData, setFormData] = useState<ProductionOrderFormData>({
    block_type: '',
    block_size: '',
    quantity_produced: 0,
    production_date: new Date().toISOString().split('T')[0],
    production_shift: 'morning',
    start_time: '',
    end_time: '',
    duration_minutes: 0,
    concrete_plant_id: '',
    materials_used: [],
    equipment_used: [],
    team_assigned: [],
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        block_type: initialData.block_type,
        block_size: initialData.block_size,
        quantity_produced: initialData.quantity_produced,
        production_date: initialData.production_date,
        production_shift: initialData.production_shift,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        duration_minutes: initialData.duration_minutes,
        concrete_plant_id: initialData.concrete_plant_id,
        materials_used: initialData.materials_used,
        equipment_used: initialData.equipment_used,
        team_assigned: initialData.team_assigned,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  // Auto-calculate duration when start/end times change
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      let diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle crossing midnight
      setFormData(prev => ({ ...prev, duration_minutes: diffMinutes }));
    }
  }, [formData.start_time, formData.end_time]);

  const handleChange = (field: keyof ProductionOrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addMaterialUsage = () => {
    setFormData(prev => ({
      ...prev,
      materials_used: [...prev.materials_used, { materialId: '', materialName: '', quantity: 0, unit: '', unitCost: 0 }]
    }));
  };

  const updateMaterialUsage = (index: number, updates: Partial<MaterialUsage>) => {
    setFormData(prev => ({
      ...prev,
      materials_used: prev.materials_used.map((m, i) =>
        i === index ? { ...m, ...updates } : m
      )
    }));
  };

  const removeMaterialUsage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials_used: prev.materials_used.filter((_, i) => i !== index)
    }));
  };

  const addEquipmentUsage = () => {
    setFormData(prev => ({
      ...prev,
      equipment_used: [...prev.equipment_used, { equipmentId: '', equipmentName: '', hoursUsed: 0, fuelConsumed: 0, hourlyCost: 0 }]
    }));
  };

  const updateEquipmentUsage = (index: number, updates: Partial<EquipmentUsage>) => {
    setFormData(prev => ({
      ...prev,
      equipment_used: prev.equipment_used.map((e, i) =>
        i === index ? { ...e, ...updates } : e
      )
    }));
  };

  const removeEquipmentUsage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment_used: prev.equipment_used.filter((_, i) => i !== index)
    }));
  };

  const addTeamAssignment = () => {
    setFormData(prev => ({
      ...prev,
      team_assigned: [...prev.team_assigned, { memberId: '', memberName: '', role: '', hoursWorked: 0, hourlyRate: 0 }]
    }));
  };

  const updateTeamAssignment = (index: number, updates: Partial<TeamAssignment>) => {
    setFormData(prev => ({
      ...prev,
      team_assigned: prev.team_assigned.map((t, i) =>
        i === index ? { ...t, ...updates } : t
      )
    }));
  };

  const removeTeamAssignment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team_assigned: prev.team_assigned.filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.block_type.trim()) {
      newErrors.block_type = 'Tipo de bloque es requerido';
    }
    if (!formData.block_size.trim()) {
      newErrors.block_size = 'Tamaño del bloque es requerido';
    }
    if (formData.quantity_produced <= 0) {
      newErrors.quantity_produced = 'Cantidad debe ser mayor a 0';
    }
    if (!formData.production_date) {
      newErrors.production_date = 'Fecha de producción es requerida';
    }
    if (!formData.production_shift) {
      newErrors.production_shift = 'Turno es requerido';
    }
    if (!formData.concrete_plant_id) {
      newErrors.concrete_plant_id = 'Planta de concreto es requerida';
    }

    // Validate materials
    if (formData.materials_used.length === 0) {
      newErrors.materials_used = 'Debe agregar al menos un material';
    } else {
      formData.materials_used.forEach((m, i) => {
        if (!m.materialId) newErrors[`material_${i}_id`] = 'Material requerido';
        if (m.quantity <= 0) newErrors[`material_${i}_qty`] = 'Cantidad > 0';
      });
    }

    // Validate team
    if (formData.team_assigned.length === 0) {
      newErrors.team_assigned = 'Debe asignar al menos un miembro del equipo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsSaving(true);

    try {
      // Calculate costs
      const material_cost = formData.materials_used.reduce(
        (sum, m) => sum + (m.quantity * m.unitCost),
        0
      );
      const labor_cost = formData.team_assigned.reduce(
        (sum, t) => sum + (t.hoursWorked * t.hourlyRate),
        0
      );
      const equipment_cost = formData.equipment_used.reduce(
        (sum, e) => sum + (e.hoursUsed * e.hourlyCost),
        0
      );
      // Energy and maintenance costs would need additional inputs; default to 0 for now
      const energy_cost = 0;
      const maintenance_cost = 0;
      const total_cost = material_cost + labor_cost + equipment_cost + energy_cost + maintenance_cost;

      // Prepare submission data
      const submissionData: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'user_id' | 'created_by_name'> = {
        block_type: formData.block_type,
        block_size: formData.block_size,
        quantity_produced: formData.quantity_produced,
        production_date: formData.production_date,
        production_shift: formData.production_shift,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_minutes: formData.duration_minutes,
        concrete_plant_id: formData.concrete_plant_id,
        materials_used: formData.materials_used,
        equipment_used: formData.equipment_used,
        team_assigned: formData.team_assigned,
        notes: formData.notes,
        status: initialData?.status || 'draft',
        // Costs
        material_cost,
        labor_cost,
        equipment_cost,
        energy_cost,
        maintenance_cost,
        total_cost,
      };

      await onSubmit(submissionData);
      toast.success(
        initialData ? 'Orden de producción actualizada exitosamente' : 'Orden de producción creada exitosamente'
      );
      onCancel();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar la orden de producción'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tipo de Bloque */}
            <div className="space-y-2">
              <Label htmlFor="block_type" className="text-sm font-medium text-neutral-700">
                Tipo de Bloque <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.block_type}
                onValueChange={(value) => handleChange('block_type', value)}
              >
                <SelectTrigger id="block_type" className={errors.block_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.block_type && <p className="text-red-500 text-xs mt-1">{errors.block_type}</p>}
            </div>

            {/* Tamaño */}
            <div className="space-y-2">
              <Label htmlFor="block_size" className="text-sm font-medium text-neutral-700">
                Tamaño <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.block_size}
                onValueChange={(value) => handleChange('block_size', value)}
              >
                <SelectTrigger id="block_size" className={errors.block_size ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_SIZES.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.block_size && <p className="text-red-500 text-xs mt-1">{errors.block_size}</p>}
            </div>

            {/* Cantidad Producida */}
            <div className="space-y-2">
              <Label htmlFor="quantity_produced" className="text-sm font-medium text-neutral-700">
                Cantidad Producida <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity_produced"
                type="number"
                min="1"
                value={formData.quantity_produced || ''}
                onChange={(e) => handleChange('quantity_produced', parseInt(e.target.value) || 0)}
                className={errors.quantity_produced ? 'border-red-500' : ''}
              />
              {errors.quantity_produced && <p className="text-red-500 text-xs mt-1">{errors.quantity_produced}</p>}
            </div>

            {/* Fecha de Producción */}
            <div className="space-y-2">
              <Label htmlFor="production_date" className="text-sm font-medium text-neutral-700">
                Fecha de Producción <span className="text-red-500">*</span>
              </Label>
              <Input
                id="production_date"
                type="date"
                value={formData.production_date}
                onChange={(e) => handleChange('production_date', e.target.value)}
                className={errors.production_date ? 'border-red-500' : ''}
              />
              {errors.production_date && <p className="text-red-500 text-xs mt-1">{errors.production_date}</p>}
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label htmlFor="production_shift" className="text-sm font-medium text-neutral-700">
                Turno <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.production_shift}
                onValueChange={(value) => handleChange('production_shift', value as any)}
              >
                <SelectTrigger id="production_shift" className={errors.production_shift ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar turno..." />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_OPTIONS.map(shift => (
                    <SelectItem key={shift.value} value={shift.value}>{shift.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.production_shift && <p className="text-red-500 text-xs mt-1">{errors.production_shift}</p>}
            </div>

            {/* Planta de Concreto */}
            <div className="space-y-2">
              <Label htmlFor="concrete_plant_id" className="text-sm font-medium text-neutral-700">
                Planta de Concreto <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.concrete_plant_id}
                onValueChange={(value) => handleChange('concrete_plant_id', value)}
              >
                <SelectTrigger id="concrete_plant_id" className={errors.concrete_plant_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar planta..." />
                </SelectTrigger>
                <SelectContent>
                  {plants.map(plant => (
                    <SelectItem key={plant.id} value={plant.id}>{plant.name} - {plant.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.concrete_plant_id && <p className="text-red-500 text-xs mt-1">{errors.concrete_plant_id}</p>}
              {plants.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Debes crear al menos una planta de concreto primero</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Times */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Tiempos de Producción</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hora Inicio */}
            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-sm font-medium text-neutral-700">
                Hora Inicio
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>

            {/* Hora Fin */}
            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-sm font-medium text-neutral-700">
                Hora Fin
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
              />
            </div>

            {/* Duración */}
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="text-sm font-medium text-neutral-700">
                Duración (minutos)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  readOnly
                  className="bg-neutral-50"
                />
                <Calculator size={20} className="text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Calculado automáticamente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Used */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Materiales Utilizados</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {formData.materials_used.map((material, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                {/* Material Select */}
                <div className="w-full sm:flex-1 space-y-2">
                  <Label htmlFor={`material-${index}`} className="text-xs font-medium text-neutral-600">
                    Material
                  </Label>
                  <Select
                    value={material.materialId}
                    onValueChange={(value) => {
                      const selectedMaterial = materials.find(m => m.id === value);
                      updateMaterialUsage(index, {
                        materialId: value,
                        materialName: selectedMaterial?.material_name || '',
                        unit: selectedMaterial?.unit || 'unidades',
                        unitCost: selectedMaterial?.unit_cost || 0
                      });
                    }}
                  >
                    <SelectTrigger id={`material-${index}`}>
                      <SelectValue placeholder="Seleccionar material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.material_name} ({m.unit} - {formatCurrency(m.unit_cost)}/unidad)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cantidad */}
                <div className="w-full sm:w-24 space-y-2">
                  <Label htmlFor={`material-qty-${index}`} className="text-xs font-medium text-neutral-600">
                    Cantidad
                  </Label>
                  <Input
                    id={`material-qty-${index}`}
                    type="number"
                    min="0"
                    value={material.quantity || ''}
                    onChange={(e) => updateMaterialUsage(index, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Unidad (readonly) */}
                <div className="w-full sm:w-20 space-y-2">
                  <Label htmlFor={`material-unit-${index}`} className="text-xs font-medium text-neutral-600">
                    Unidad
                  </Label>
                  <Input
                    id={`material-unit-${index}`}
                    type="text"
                    value={material.unit}
                    readOnly
                    className="bg-neutral-50"
                  />
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMaterialUsage(index)}
                  className="mt-0 sm:mt-6 w-full sm:w-auto"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Material Button */}
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={addMaterialUsage} className="w-full">
              <Plus size={16} className="mr-2" />
              Agregar Material
            </Button>
          </div>

          {/* Error Message */}
          {errors.materials_used && (
            <p className="text-red-500 text-sm mt-2">{errors.materials_used}</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Used */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Equipos Utilizados</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {formData.equipment_used.map((equip, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                {/* Equipo Select */}
                <div className="w-full sm:flex-1 space-y-2">
                  <Label htmlFor={`equip-${index}`} className="text-xs font-medium text-neutral-600">
                    Equipo
                  </Label>
                  <Select
                    value={equip.equipmentId}
                    onValueChange={(value) => {
                      const selectedEquipment = allEquipment.find(eq => eq.id === value);
                      updateEquipmentUsage(index, {
                        equipmentId: value,
                        equipmentName: selectedEquipment?.name || '',
                        hourlyCost: selectedEquipment?.hourly_cost || 0
                      });
                    }}
                  >
                    <SelectTrigger id={`equip-${index}`}>
                      <SelectValue placeholder="Seleccionar equipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allEquipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horas */}
                <div className="w-full sm:w-24 space-y-2">
                  <Label htmlFor={`equip-hours-${index}`} className="text-xs font-medium text-neutral-600">
                    Horas
                  </Label>
                  <Input
                    id={`equip-hours-${index}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={equip.hoursUsed || ''}
                    onChange={(e) => updateEquipmentUsage(index, { hoursUsed: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Combustible */}
                <div className="w-full sm:w-32 space-y-2">
                  <Label htmlFor={`equip-fuel-${index}`} className="text-xs font-medium text-neutral-600">
                    Combustible (L)
                  </Label>
                  <Input
                    id={`equip-fuel-${index}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={equip.fuelConsumed || ''}
                    onChange={(e) => updateEquipmentUsage(index, { fuelConsumed: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEquipmentUsage(index)}
                  className="mt-0 sm:mt-6 w-full sm:w-auto"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={addEquipmentUsage} className="w-full">
              <Plus size={16} className="mr-2" />
              Agregar Equipo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Assigned */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Equipo Asignado</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {formData.team_assigned.map((member, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                {/* Miembro Select */}
                <div className="w-full sm:flex-1 space-y-2">
                  <Label htmlFor={`member-${index}`} className="text-xs font-medium text-neutral-600">
                    Miembro
                  </Label>
                  <Select
                    value={member.memberId}
                    onValueChange={(value) => {
                      const selectedMember = members.find(m => m.id === value);
                      updateTeamAssignment(index, {
                        memberId: value,
                        memberName: selectedMember?.name || '',
                        role: selectedMember?.role || '',
                        hourlyRate: selectedMember?.hourly_rate || 0
                      });
                    }}
                  >
                    <SelectTrigger id={`member-${index}`}>
                      <SelectValue placeholder="Seleccionar miembro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horas */}
                <div className="w-full sm:w-24 space-y-2">
                  <Label htmlFor={`member-hours-${index}`} className="text-xs font-medium text-neutral-600">
                    Horas
                  </Label>
                  <Input
                    id={`member-hours-${index}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={member.hoursWorked || ''}
                    onChange={(e) => updateTeamAssignment(index, { hoursWorked: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Tarifa/hora */}
                <div className="w-full sm:w-32 space-y-2">
                  <Label htmlFor={`member-rate-${index}`} className="text-xs font-medium text-neutral-600">
                    Tarifa/hora
                  </Label>
                  <div className="px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium">
                    ${member.hourlyRate.toFixed(2)}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTeamAssignment(index)}
                  className="mt-0 sm:mt-6 w-full sm:w-auto"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={addTeamAssignment} className="w-full">
              <Plus size={16} className="mr-2" />
              Agregar Miembro del Equipo
            </Button>
          </div>

          {errors.team_assigned && (
            <p className="text-red-500 text-sm mt-2">{errors.team_assigned}</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-h3 text-neutral-900">Notas Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder="Notas, observaciones, comentarios..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSaving}>
          {isSaving ? 'Guardando...' : initialData ? 'Actualizar Orden' : 'Crear Orden'}
        </Button>
      </div>
    </form>
  );
}
