'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ProductionOrder,
  ProductionOrderFormData,
  MaterialUsage,
  EquipmentUsage,
  TeamAssignment
} from '@/types/production-order';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useProductionOrders } from '@/lib/hooks/useProductionOrders';
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

interface ProductionOrderFormProps {
  onSubmit: (data: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'user_id' | 'created_by_name'>) => void;
  onCancel: () => void;
  initialData?: ProductionOrder | null;
}

export function ProductionOrderForm({ onSubmit, onCancel, initialData }: ProductionOrderFormProps) {
  const { user } = useAuth();
  const { addMaterial } = useInventoryMaterials({ userRole: 'engineer' });
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
      return;
    }

    setIsSaving(true);

    try {
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
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card title="Información Básica" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Bloque <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.block_type}
              onChange={(e) => handleChange('block_type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.block_type ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar...</option>
              {BLOCK_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.block_type && <p className="text-red-500 text-xs mt-1">{errors.block_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.block_size}
              onChange={(e) => handleChange('block_size', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.block_size ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar...</option>
              {BLOCK_SIZES.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            {errors.block_size && <p className="text-red-500 text-xs mt-1">{errors.block_size}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Producida <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity_produced}
              onChange={(e) => handleChange('quantity_produced', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.quantity_produced ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.quantity_produced && <p className="text-red-500 text-xs mt-1">{errors.quantity_produced}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Producción <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.production_date}
              onChange={(e) => handleChange('production_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.production_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.production_date && <p className="text-red-500 text-xs mt-1">{errors.production_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turno <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.production_shift}
              onChange={(e) => handleChange('production_shift', e.target.value as any)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.production_shift ? 'border-red-500' : 'border-gray-300'}`}
            >
              {SHIFT_OPTIONS.map(shift => (
                <option key={shift.value} value={shift.value}>{shift.label}</option>
              ))}
            </select>
            {errors.production_shift && <p className="text-red-500 text-xs mt-1">{errors.production_shift}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planta de Concreto <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.concrete_plant_id}
              onChange={(e) => handleChange('concrete_plant_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.concrete_plant_id ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar planta...</option>
              {plants.map(plant => (
                <option key={plant.id} value={plant.id}>{plant.name} - {plant.location}</option>
              ))}
            </select>
            {errors.concrete_plant_id && <p className="text-red-500 text-xs mt-1">{errors.concrete_plant_id}</p>}
            {plants.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Debes crear al menos una planta de concreto primero</p>
            )}
          </div>
        </div>
      </Card>

      {/* Production Times */}
      <Card title="Tiempos de Producción" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora Inicio
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora Fin
            </label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.duration_minutes}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <Calculator size={20} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
          </div>
        </div>
      </Card>

      {/* Materials Used */}
      <Card title="Materiales Utilizados" className="p-6">
        <div className="space-y-4">
          {formData.materials_used.map((material, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Material
                </label>
                <select
                  value={material.materialId}
                  onChange={(e) => {
                    const selectedMaterial = allEquipment.find(m => m.id === e.target.value); // TODO: use inventory materials
                    updateMaterialUsage(index, {
                      materialId: e.target.value,
                      materialName: selectedMaterial?.name || '',
                      unit: 'unidades',
                      unitCost: 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar material...</option>
                  {/* TODO: Populate from inventory_materials */}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="0"
                  value={material.quantity}
                  onChange={(e) => updateMaterialUsage(index, { quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="w-20">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unidad
                </label>
                <input
                  type="text"
                  value={material.unit}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeMaterialUsage(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addMaterialUsage} className="w-full">
            <Plus size={16} className="mr-2" />
            Agregar Material
          </Button>

          {errors.materials_used && (
            <p className="text-red-500 text-sm">{errors.materials_used}</p>
          )}
        </div>
      </Card>

      {/* Equipment Used */}
      <Card title="Equipos Utilizados" className="p-6">
        <div className="space-y-4">
          {formData.equipment_used.map((equip, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Equipo
                </label>
                <select
                  value={equip.equipmentId}
                  onChange={(e) => {
                    const selectedEquipment = allEquipment.find(eq => eq.id === e.target.value);
                    updateEquipmentUsage(index, {
                      equipmentId: e.target.value,
                      equipmentName: selectedEquipment?.name || '',
                      hourlyCost: selectedEquipment?.hourly_cost || 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar equipo...</option>
                  {allEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Horas
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={equip.hoursUsed}
                  onChange={(e) => updateEquipmentUsage(index, { hoursUsed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Combustible (L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={equip.fuelConsumed || 0}
                  onChange={(e) => updateEquipmentUsage(index, { fuelConsumed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeEquipmentUsage(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addEquipmentUsage} className="w-full">
            <Plus size={16} className="mr-2" />
            Agregar Equipo
          </Button>
        </div>
      </Card>

      {/* Team Assigned */}
      <Card title="Equipo Asignado" className="p-6">
        <div className="space-y-4">
          {formData.team_assigned.map((member, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Miembro
                </label>
                <select
                  value={member.memberId}
                  onChange={(e) => {
                    const selectedMember = members.find(m => m.id === e.target.value);
                    updateTeamAssignment(index, {
                      memberId: e.target.value,
                      memberName: selectedMember?.name || '',
                      role: selectedMember?.role || '',
                      hourlyRate: selectedMember?.hourly_rate || 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar miembro...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Horas
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={member.hoursWorked}
                  onChange={(e) => updateTeamAssignment(index, { hoursWorked: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tarifa/hora
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                  ${member.hourlyRate.toFixed(2)}
                </div>
              </div>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeTeamAssignment(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addTeamAssignment} className="w-full">
            <Plus size={16} className="mr-2" />
            Agregar Miembro del Equipo
          </Button>

          {errors.team_assigned && (
            <p className="text-red-500 text-sm">{errors.team_assigned}</p>
          )}
        </div>
      </Card>

      {/* Notes */}
      <Card title="Notas Adicionales" className="p-6">
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Notas, observaciones, comentarios..."
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
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
