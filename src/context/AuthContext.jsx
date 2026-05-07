import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { store } from '../lib/store';

const AuthContext = createContext({});

// Demo credentials — IDs match seed.mjs user UUIDs
const DEMO_USERS = {
  'pmo@demo.com':     { id: 'ad68f966-c6cf-46fc-96d1-1c4e7b0dae48', email: 'pmo@demo.com',     name: 'Sarah Jenkins', role: 'PMO',    password: 'pmo'     },
  'pmo2@demo.com':    { id: 'cd68f966-c6cf-46fc-96d1-1c4e7b0dae50', email: 'pmo2@demo.com',    name: 'Rahul Sharma',  role: 'PMO',    password: 'pmo2'    },
  'client@demo.com':  { id: 'bd68f966-c6cf-46fc-96d1-1c4e7b0dae49', email: 'client@demo.com',  name: 'Michael Brown', role: 'Client', password: 'client'  },
  'client2@demo.com': { id: 'dd68f966-c6cf-46fc-96d1-1c4e7b0dae51', email: 'client2@demo.com', name: 'David Kim',     role: 'Client', password: 'client2' },
  'client3@demo.com': { id: 'ed68f966-c6cf-46fc-96d1-1c4e7b0dae52', email: 'client3@demo.com', name: 'Priya Mehta',   role: 'Client', password: 'client3' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for Local Demo Session first
    const savedDemoUser = localStorage.getItem('gcc_demo_user');
    if (savedDemoUser) {
      setUser(JSON.parse(savedDemoUser));
      setLoading(false);
      return;
    }

    // Otherwise check Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user);
      } else {
        // Only clear if not in demo mode
        if (!localStorage.getItem('gcc_demo_user')) {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) throw error;
      setUser({ ...authUser, ...data });
      // Trigger store data refetch now that we have an authenticated session
      store.init();
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to basic auth info if profile fetch fails
      setUser({ 
        id: authUser.id, 
        email: authUser.email, 
        name: authUser.user_metadata?.name || authUser.email,
        role: authUser.user_metadata?.role || 'Client'
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      const base = DEMO_USERS[email];
      // Fetch DB profile to get assigned_project_id and any other persisted fields
      const { data: profile } = await supabase.from('users').select('*').eq('id', base.id).single();
      const fullUser = { ...base, ...(profile || {}) };
      localStorage.setItem('gcc_demo_user', JSON.stringify(fullUser));
      setUser(fullUser);
      store.init();
      return { data: fullUser, error: null };
    }

    // Fallback to real Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return { data, error: null };
  };

  const logout = async () => {
    localStorage.removeItem('gcc_demo_user');
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: user, // Alias for App.jsx
      currentUser: user, // Alias for other components
      signIn, 
      signUp,
      logout, 
      loading, 
      isLoading: loading, // Alias for App.jsx
      isPMO: user?.role === 'PMO' 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
