'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ConcretePlant } from '@/types/inventory';

// Form validation schema
const plantFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  location: z.string().min(1, 'La ubicación es requerida'),
  capacity_per_hour: z.number().min(1, 'La capacidad debe ser mayor a 0'),
  is_active: z.boolean().optional(),
});

type PlantFormData = z.infer<typeof plantFormSchema>;

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ConcretePlant, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function PlantDialog({ open, onOpenChange, onSubmit }: PlantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: '',
      location: '',
      capacity_per_hour: 1,
      is_active: true,
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: PlantFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        location: data.location,
        capacity_per_hour: data.capacity_per_hour,
        is_active: data.is_active ?? true,
      });

      toast.success('Planta agregada', {
        description: 'La planta de concreto ha sido creada exitosamente.',
      });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'No se pudo crear la planta',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Planta</DialogTitle>
          <DialogDescription>
            Completa la información de la planta de concreto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Planta Centro"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Ej: Av. Industrial 123"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity_per_hour">Capacidad (m³/h) *</Label>
            <Input
              id="capacity_per_hour"
              type="number"
              min="1"
              {...register('capacity_per_hour', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.capacity_per_hour && (
              <p className="text-sm text-red-600">{errors.capacity_per_hour.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Planta activa</Label>
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
