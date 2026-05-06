import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { store } from '../lib/store';

const AuthContext = createContext({});

// 🚀 LOCAL DEMO CREDENTIALS
const DEMO_USERS = {
  'pmo@demo.com': { 
    id: 'ad68f966-c6cf-46fc-96d1-1c4e7b0dae48', // Matches Sarah Jenkins in DB
    email: 'pmo@demo.com', 
    name: 'Sarah Jenkins (Demo)', 
    role: 'PMO',
    password: 'pmo' 
  },
  'client@demo.com': { 
    id: 'bd68f966-c6cf-46fc-96d1-1c4e7b0dae49', // Matches Michael Brown in DB
    email: 'client@demo.com', 
    name: 'Michael Brown (Demo)', 
    role: 'Client',
    password: 'client' 
  }
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
    // 🛡️ CHECK FOR LOCAL DEMO BYPASS
    if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      const demoUser = DEMO_USERS[email];
      localStorage.setItem('gcc_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      store.init();
      return { data: demoUser, error: null };
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
