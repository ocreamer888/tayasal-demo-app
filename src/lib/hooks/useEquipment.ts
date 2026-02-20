import { useState, useEffect, useCallback } from 'react';
import { Equipment } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

function transformEquipmentFromDB(dbEquipment: Record<string, unknown>): Equipment {
  const result: Equipment = {
    id: dbEquipment.id as string,
    user_id: dbEquipment.user_id as string,
    name: dbEquipment.name as string,
    hourly_cost: dbEquipment.hourly_cost as number,
    status: dbEquipment.status as 'active' | 'maintenance' | 'retired',
    created_at: dbEquipment.created_at as string,
    updated_at: dbEquipment.updated_at as string,
  };
  if (dbEquipment.model) result.model = dbEquipment.model as string;
  if (dbEquipment.serial_number) result.serial_number = dbEquipment.serial_number as string;
  if (dbEquipment.purchase_date) result.purchase_date = dbEquipment.purchase_date as string;
  if (dbEquipment.maintenance_schedule) result.maintenance_schedule = dbEquipment.maintenance_schedule as string;
  if (dbEquipment.fuel_consumption_rate) result.fuel_consumption_rate = dbEquipment.fuel_consumption_rate as number;
  return result;
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabaseInstance = supabase;
  const userId = user?.id;

  const fetchEquipment = useCallback(async () => {
    if (!userId) {
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
        .eq('user_id', userId)
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
  }, [userId, supabase]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`equipment-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments',
          filter: `user_id=eq.${userId}`,
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
  }, [userId, supabase]);

  const addEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      throw new Error('Debes iniciar sesión para agregar equipos');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Optimistic add
    const optimisticEquipment: Equipment = {
      ...equipmentData,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    setEquipment(prev => [...prev, optimisticEquipment]);

    try {
      const newEquipment = {
        user_id: userId,
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

      const transformedData = transformEquipmentFromDB(data);

      setEquipment(prev =>
        prev.map(e => e.id === tempId ? transformedData : e)
      );

      return transformedData;
    } catch (err) {
      console.error('Error adding equipment:', err);

      // Rollback
      setEquipment(prev => prev.filter(e => e.id !== tempId));

      throw err;
    }
  }, [userId, supabase, setEquipment]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    if (!userId) return;

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as Record<string, unknown>)[key];
      });

      const { error: updateError } = await supabase
        .from('equipments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating equipment:', err);
      throw err;
    }
  }, [userId, supabase]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const { error: deleteError } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting equipment:', err);
      throw err;
    }
  }, [userId, supabase]);

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
