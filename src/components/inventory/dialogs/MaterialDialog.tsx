'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { InventoryMaterial } from '@/types/inventory';

// Form validation schema
const materialFormSchema = z.object({
  material_name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum(['cement', 'sand', 'aggregate', 'additive', 'other']),
  unit: z.string().min(1, 'La unidad es requerida'),
  current_quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  min_stock_quantity: z.number().min(0, 'La cantidad mínima no puede ser negativa'),
  unit_cost: z.number().min(0, 'El costo no puede ser negativo'),
  location: z.string(),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<InventoryMaterial, 'id' | 'user_id' | 'last_updated' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function MaterialDialog({ open, onOpenChange, onSubmit }: MaterialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      material_name: '',
      category: 'other',
      unit: '',
      current_quantity: 0,
      min_stock_quantity: 0,
      unit_cost: 0,
      location: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        material_name: data.material_name,
        category: data.category,
        unit: data.unit,
        current_quantity: data.current_quantity,
        min_stock_quantity: data.min_stock_quantity,
        unit_cost: data.unit_cost,
        location: data.location,
      });

      toast.success('Material agregado', {
        description: 'El material ha sido creado exitosamente.',
      });

      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear el material';
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Material</DialogTitle>
          <DialogDescription>
            Completa la información del material para agregarlo al inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Material Name */}
          <div className="space-y-2">
            <Label htmlFor="material_name">Nombre del Material *</Label>
            <Input
              id="material_name"
              {...register('material_name')}
              placeholder="Ej: Cemento Portland"
            />
            {errors.material_name && (
              <p className="text-sm text-red-600">{errors.material_name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              onValueChange={(value) => register('category').onChange({ target: { value } })}
              defaultValue="other"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cement">Cemento</SelectItem>
                <SelectItem value="sand">Arena</SelectItem>
                <SelectItem value="aggregate">Agregado</SelectItem>
                <SelectItem value="additive">Aditivo</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unidad *</Label>
            <Input
              id="unit"
              {...register('unit')}
              placeholder="Ej: kg, m³, unidades"
            />
            {errors.unit && (
              <p className="text-sm text-red-600">{errors.unit.message}</p>
            )}
          </div>

          {/* Current Quantity */}
          <div className="space-y-2">
            <Label htmlFor="current_quantity">Cantidad Actual *</Label>
            <Input
              id="current_quantity"
              type="number"
              min="0"
              {...register('current_quantity', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.current_quantity && (
              <p className="text-sm text-red-600">{errors.current_quantity.message}</p>
            )}
          </div>

          {/* Minimum Quantity */}
          <div className="space-y-2">
            <Label htmlFor="min_stock_quantity">Cantidad Mínima *</Label>
            <Input
              id="min_stock_quantity"
              type="number"
              min="0"
              {...register('min_stock_quantity', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.min_stock_quantity && (
              <p className="text-sm text-red-600">{errors.min_stock_quantity.message}</p>
            )}
          </div>

          {/* Unit Cost */}
          <div className="space-y-2">
            <Label htmlFor="unit_cost">Costo Unitario (CLP) *</Label>
            <Input
              id="unit_cost"
              type="number"
              min="0"
              step="0.01"
              {...register('unit_cost', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.unit_cost && (
              <p className="text-sm text-red-600">{errors.unit_cost.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación (opcional)</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Ej: Almacén A, Estante 3"
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
