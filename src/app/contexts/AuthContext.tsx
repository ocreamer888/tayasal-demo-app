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
        .eq('id', userId)  // profiles table uses 'id' not 'user_id'
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
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
          } else {
          }
        }
      })
      .catch(err => {
        clearTimeout(getUserTimeout);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        } else {
        }
      });


    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔧 AuthContext: onAuthStateChange fired:', event, session?.user?.email || 'no user');
      if (!mounted) return;

      // Update user immediately
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile in background without blocking loading state
        fetchProfile(session.user.id).catch(err => {
          console.error('🔧 AuthContext: Profile fetch failed:', err);
          setProfile(null);
        });
      } else {
        setProfile(null);
      }

      // Mark auth as ready (profile may still be loading, but that's okay)
      setLoading(false);
      router.refresh();
    });

    return () => {
      console.log('🔧 AuthContext: Unmounting - setting mounted=false');
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
