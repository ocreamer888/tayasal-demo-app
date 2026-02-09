import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

function transformTeamMemberFromDB(dbMember: any): TeamMember {
  return {
    id: dbMember.id,
    user_id: dbMember.user_id,
    name: dbMember.name,
    role: dbMember.role,
    hourly_rate: dbMember.hourly_rate,
    contact_phone: dbMember.contact_phone,
    hire_date: dbMember.hire_date,
    created_at: dbMember.created_at,
    updated_at: dbMember.updated_at,
  };
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabaseInstance = supabase;

  const fetchMembers = useCallback(async () => {
    if (!user) {
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
        .eq('user_id', user.id)
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
  }, [user, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`team-members-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user.id}`,
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
  }, [user, supabase]);

  const addMember = useCallback(async (memberData: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para agregar miembros');
    }

    const now = new Date().toISOString();

    try {
      const newMember = {
        user_id: user.id,
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

      return transformTeamMemberFromDB(data);
    } catch (err) {
      console.error('Error adding team member:', err);
      throw err;
    }
  }, [user, supabase]);

  const updateMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    if (!user) return;

    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as any)[key];
      });

      const { error: updateError } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating team member:', err);
      throw err;
    }
  }, [user, supabase]);

  const deleteMember = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting team member:', err);
      throw err;
    }
  }, [user, supabase]);

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
