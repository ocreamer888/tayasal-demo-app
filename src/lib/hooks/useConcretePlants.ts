import { useState, useEffect, useCallback } from 'react';
import { ConcretePlant } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

function transformPlantFromDB(dbPlant: Record<string, unknown>): ConcretePlant {
  return {
    id: dbPlant.id as string,
    user_id: dbPlant.user_id as string,
    name: dbPlant.name as string,
    location: dbPlant.location as string,
    capacity_per_hour: dbPlant.capacity_per_hour as number,
    is_active: dbPlant.is_active as boolean,
    created_at: dbPlant.created_at as string,
    updated_at: dbPlant.updated_at as string,
  };
}

export function useConcretePlants() {
  const [plants, setPlants] = useState<ConcretePlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabaseInstance = supabase;
  const userId = user?.id;

  const fetchPlants = useCallback(async () => {
    if (!userId) {
      setPlants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ALL users see all plants (data is shared)
      const { data, error: fetchError } = await supabase
        .from('concrete_plants')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformPlantFromDB);
      setPlants(transformedData);
    } catch (err) {
      console.error('Error fetching concrete plants:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar plantas de concreto');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Real-time subscription - ALL users see all changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`plants-all-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'concrete_plants',
        },
        (payload) => {
          console.log('Concrete plant change received:', payload);

          if (payload.eventType === 'INSERT') {
            const transformedPlant = transformPlantFromDB(payload.new);
            setPlants(prev => {
              const exists = prev.some(p => p.id === transformedPlant.id);
              if (exists) {
                return prev.map(p => p.id === transformedPlant.id ? transformedPlant : p);
              }
              return [...prev, transformedPlant];
            });
          } else if (payload.eventType === 'UPDATE') {
            const transformedPlant = transformPlantFromDB(payload.new);
            setPlants(prev =>
              prev.map(p => p.id === payload.new.id ? transformedPlant : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setPlants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  }, [userId, supabase]);

  const addPlant = useCallback(async (plant: Omit<ConcretePlant, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      throw new Error('Debes iniciar sesión para agregar plantas');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Optimistic add
    const optimisticPlant: ConcretePlant = {
      ...plant,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    setPlants(prev => [...prev, optimisticPlant]);

    try {
      const newPlant = {
        user_id: userId,
        ...plant,
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('concrete_plants')
        .insert([newPlant])
        .select()
        .single();

      if (insertError) throw insertError;

      const transformedData = transformPlantFromDB(data);

      setPlants(prev =>
        prev.map(p => p.id === tempId ? transformedData : p)
      );

      return transformedData;
    } catch (err) {
      console.error('Error adding concrete plant:', err);

      // Rollback
      setPlants(prev => prev.filter(p => p.id !== tempId));

      throw err;
    }
  }, [userId, supabase, setPlants]);

  const updatePlant = useCallback(async (id: string, updates: Partial<ConcretePlant>) => {
    if (!userId) return;

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as Record<string, unknown>)[key];
      });

      // RLS policy handles access control (operators can only update own, engineers/admins can update all)
      const { error: updateError } = await supabase
        .from('concrete_plants')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating concrete plant:', err);
      throw err;
    }
  }, [userId, supabase]);

  const deletePlant = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      // RLS policy handles access control (operators can only delete own, engineers/admins can delete all)
      const { error: deleteError } = await supabase
        .from('concrete_plants')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting concrete plant:', err);
      throw err;
    }
  }, [userId, supabase]);

  return {
    plants,
    loading,
    error,
    refetch: fetchPlants,
    addPlant,
    updatePlant,
    deletePlant,
  };
}
