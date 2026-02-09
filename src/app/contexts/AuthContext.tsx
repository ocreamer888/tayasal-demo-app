'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const getUserTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        clearTimeout(getUserTimeout);
        if (mounted) {
          setUser(user);
          if (user) {
            fetchProfile(user.id);
          }
        }
      })
      .catch(err => {
        console.error('AuthContext: Error getting user:', err);
        clearTimeout(getUserTimeout);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            try {
              await fetchProfile(session.user.id);
            } catch (profileErr) {
              console.error('AuthContext: Profile fetch failed:', profileErr);
            }
          } else {
            setProfile(null);
          }
          router.refresh();
        }
      } catch (err) {
        console.error('AuthContext: onAuthStateChange error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
