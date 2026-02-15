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
import { TeamMember } from '@/types/inventory';

// Form validation schema
const teamFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.string().min(1, 'El rol es requerido'),
  hourly_rate: z.number().min(0, 'La tarifa no puede ser negativa'),
  contact_phone: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<TeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'hire_date'>) => Promise<void>;
}

export function TeamDialog({ open, onOpenChange, onSubmit }: TeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: '',
      role: '',
      hourly_rate: 0,
      contact_phone: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        role: data.role,
        hourly_rate: data.hourly_rate,
        contact_phone: data.contact_phone || undefined,
      });

      toast.success('Miembro agregado', {
        description: 'El miembro del equipo ha sido agregado exitosamente.',
      });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'No se pudo agregar el miembro',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Miembro del Equipo</DialogTitle>
          <DialogDescription>
            Completa la información del nuevo miembro del equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Juan Pérez"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="Ej: Operador, Supervisor, Ingeniero"
            />
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Tarifa por Hora (CLP) *</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              step="0.01"
              {...register('hourly_rate', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.hourly_rate && (
              <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Teléfono de Contacto (opcional)</Label>
            <Input
              id="contact_phone"
              {...register('contact_phone')}
              placeholder="Ej: +56 9 1234 5678"
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
