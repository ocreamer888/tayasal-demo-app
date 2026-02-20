import { useState, useEffect, useCallback } from 'react';
import { ConcretePlant } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

interface UseConcreteplantsProps {
  userRole: 'operator' | 'engineer' | 'admin' | null;
}

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

export function useConcretePlants({ userRole }: UseConcreteplantsProps) {
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

      // Build query based on user role
      let query = supabase
        .from('concrete_plants')
        .select('*')
        .order('name', { ascending: true });

      // Filter by user_id if operator (only see their own plants)
      if (userRole === 'operator') {
        query = query.eq('user_id', userId);
      }
      // Engineers and admins see all plants (via RLS policy)

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformPlantFromDB);
      setPlants(transformedData);
    } catch (err) {
      console.error('Error fetching concrete plants:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar plantas de concreto');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, supabase]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Build filter based on user role
    const filter = userRole === 'operator' ? `user_id=eq.${userId}` : undefined;

    const channel = supabase
      .channel(`plants-${userRole || 'all'}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'concrete_plants',
          filter: filter,
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
  }, [userId, userRole, supabase]);

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

      let query = supabase
        .from('concrete_plants')
        .update(updateData)
        .eq('id', id);

      // Only add user_id filter for operators
      if (userRole === 'operator') {
        query = query.eq('user_id', userId);
      }

      const { error: updateError } = await query;

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating concrete plant:', err);
      throw err;
    }
  }, [userId, userRole, supabase]);

  const deletePlant = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      let query = supabase
        .from('concrete_plants')
        .delete()
        .eq('id', id);

      // Only add user_id filter for operators
      if (userRole === 'operator') {
        query = query.eq('user_id', userId);
      }

      const { error: deleteError } = await query;

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting concrete plant:', err);
      throw err;
    }
  }, [userId, userRole, supabase]);

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
