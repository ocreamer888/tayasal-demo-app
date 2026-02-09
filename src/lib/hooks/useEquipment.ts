import { useState, useEffect, useCallback } from 'react';
import { Equipment } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

function transformEquipmentFromDB(dbEquipment: any): Equipment {
  return {
    id: dbEquipment.id,
    user_id: dbEquipment.user_id,
    name: dbEquipment.name,
    model: dbEquipment.model,
    serial_number: dbEquipment.serial_number,
    purchase_date: dbEquipment.purchase_date,
    maintenance_schedule: dbEquipment.maintenance_schedule,
    hourly_cost: dbEquipment.hourly_cost,
    fuel_consumption_rate: dbEquipment.fuel_consumption_rate,
    status: dbEquipment.status,
    created_at: dbEquipment.created_at,
    updated_at: dbEquipment.updated_at,
  };
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabaseInstance = supabase;

  const fetchEquipment = useCallback(async () => {
    if (!user) {
      setEquipment([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('equipments')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformEquipmentFromDB);
      setEquipment(transformedData);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`equipment-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Equipment change received:', payload);

          if (payload.eventType === 'INSERT') {
            const transformedEquipment = transformEquipmentFromDB(payload.new);
            setEquipment(prev => [...prev, transformedEquipment]);
          } else if (payload.eventType === 'UPDATE') {
            const transformedEquipment = transformEquipmentFromDB(payload.new);
            setEquipment(prev =>
              prev.map(e => e.id === payload.new.id ? transformedEquipment : e)
            );
          } else if (payload.eventType === 'DELETE') {
            setEquipment(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  }, [user, supabase]);

  const addEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para agregar equipos');
    }

    const now = new Date().toISOString();

    try {
      const newEquipment = {
        user_id: user.id,
        ...equipmentData,
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('equipments')
        .insert([newEquipment])
        .select()
        .single();

      if (insertError) throw insertError;

      return transformEquipmentFromDB(data);
    } catch (err) {
      console.error('Error adding equipment:', err);
      throw err;
    }
  }, [user, supabase]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    if (!user) return;

    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as any)[key];
      });

      const { error: updateError } = await supabase
        .from('equipments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating equipment:', err);
      throw err;
    }
  }, [user, supabase]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting equipment:', err);
      throw err;
    }
  }, [user, supabase]);

  return {
    equipment,
    loading,
    error,
    refetch: fetchEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  };
}
