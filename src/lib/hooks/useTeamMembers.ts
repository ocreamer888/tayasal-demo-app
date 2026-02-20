import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

function transformTeamMemberFromDB(dbMember: Record<string, unknown>): TeamMember {
  const result: TeamMember = {
    id: dbMember.id as string,
    name: dbMember.name as string,
    role: dbMember.role as string,
    hourly_rate: dbMember.hourly_rate as number,
    created_at: dbMember.created_at as string,
    updated_at: dbMember.updated_at as string,
  };
  if (dbMember.user_id) result.user_id = dbMember.user_id as string;
  if (dbMember.contact_phone) result.contact_phone = dbMember.contact_phone as string;
  if (dbMember.hire_date) result.hire_date = dbMember.hire_date as string;
  return result;
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabaseInstance = supabase;
  const userId = user?.id;

  const fetchMembers = useCallback(async () => {
    if (!userId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformTeamMemberFromDB);
      setMembers(transformedData);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar miembros del equipo');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`team-members-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Team member change received:', payload);

          if (payload.eventType === 'INSERT') {
            const transformedMember = transformTeamMemberFromDB(payload.new);
            setMembers(prev => [...prev, transformedMember]);
          } else if (payload.eventType === 'UPDATE') {
            const transformedMember = transformTeamMemberFromDB(payload.new);
            setMembers(prev =>
              prev.map(m => m.id === payload.new.id ? transformedMember : m)
            );
          } else if (payload.eventType === 'DELETE') {
            setMembers(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  }, [userId, supabase]);

  const addMember = useCallback(async (memberData: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      throw new Error('Debes iniciar sesión para agregar miembros');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Optimistic add
    const optimisticMember: TeamMember = {
      ...memberData,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    setMembers(prev => [...prev, optimisticMember]);

    try {
      const newMember = {
        user_id: userId,
        ...memberData,
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('team_members')
        .insert([newMember])
        .select()
        .single();

      if (insertError) throw insertError;

      const transformedData = transformTeamMemberFromDB(data);

      setMembers(prev =>
        prev.map(m => m.id === tempId ? transformedData : m)
      );

      return transformedData;
    } catch (err) {
      console.error('Error adding team member:', err);

      // Rollback
      setMembers(prev => prev.filter(m => m.id !== tempId));

      throw err;
    }
  }, [userId, supabase, setMembers]);

  const updateMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    if (!userId) return;

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as Record<string, unknown>)[key];
      });

      const { error: updateError } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating team member:', err);
      throw err;
    }
  }, [userId, supabase]);

  const deleteMember = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting team member:', err);
      throw err;
    }
  }, [userId, supabase]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    updateMember,
    deleteMember,
  };
}
