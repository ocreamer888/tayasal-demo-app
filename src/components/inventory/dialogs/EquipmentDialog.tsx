'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Equipment } from '@/types/inventory';

// Form validation schema
const equipmentFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  hourly_cost: z.number().min(0, 'El costo no puede ser negativo'),
  status: z.enum(['active', 'maintenance', 'retired']),
  purchase_date: z.string().optional(),
  maintenance_schedule: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Equipment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function EquipmentDialog({ open, onOpenChange, onSubmit }: EquipmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: '',
      model: '',
      serial_number: '',
      hourly_cost: 0,
      status: 'active',
      purchase_date: '',
      maintenance_schedule: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        model: data.model || undefined,
        serial_number: data.serial_number || undefined,
        hourly_cost: data.hourly_cost,
        status: data.status,
        purchase_date: data.purchase_date || undefined,
        maintenance_schedule: data.maintenance_schedule || undefined,
      });

      toast.success('Equipo agregado', {
        description: 'El equipo ha sido creado exitosamente.',
      });

      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear el equipo';
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Equipo</DialogTitle>
          <DialogDescription>
            Completa la información del equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Excavadora"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo (opcional)</Label>
            <Input
              id="model"
              {...register('model')}
              placeholder="Ej: CAT 320"
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serial_number">Número de Serie (opcional)</Label>
            <Input
              id="serial_number"
              {...register('serial_number')}
              placeholder="Ej: SN123456"
            />
          </div>

          {/* Hourly Cost */}
          <div className="space-y-2">
            <Label htmlFor="hourly_cost">Costo por Hora (CLP) *</Label>
            <Input
              id="hourly_cost"
              type="number"
              min="0"
              step="0.01"
              {...register('hourly_cost', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.hourly_cost && (
              <p className="text-sm text-red-600">{errors.hourly_cost.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select
              onValueChange={(value) => register('status').onChange({ target: { value } })}
              defaultValue="active"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                <SelectItem value="retired">Retirado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Fecha de Compra (opcional)</Label>
            <Input
              id="purchase_date"
              type="date"
              {...register('purchase_date')}
            />
          </div>

          {/* Maintenance Schedule */}
          <div className="space-y-2">
            <Label htmlFor="maintenance_schedule">Horario de Mantenimiento (opcional)</Label>
            <Textarea
              id="maintenance_schedule"
              {...register('maintenance_schedule')}
              placeholder="Ej: Cambio de aceite cada 250 horas"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
