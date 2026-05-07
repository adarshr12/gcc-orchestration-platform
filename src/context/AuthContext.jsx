import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { store } from '../lib/store';

const AuthContext = createContext({});

// Demo credentials — short passwords for the login form
const DEMO_USERS = {
  'pmo@demo.com':     { email: 'pmo@demo.com',     name: 'Sarah Jenkins', role: 'PMO',    password: 'pmo'     },
  'pmo2@demo.com':    { email: 'pmo2@demo.com',    name: 'Rahul Sharma',  role: 'PMO',    password: 'pmo2'    },
  'client@demo.com':  { email: 'client@demo.com',  name: 'Michael Brown', role: 'Client', password: 'client'  },
  'client2@demo.com': { email: 'client2@demo.com', name: 'David Kim',     role: 'Client', password: 'client2' },
  'client3@demo.com': { email: 'client3@demo.com', name: 'Priya Mehta',   role: 'Client', password: 'client3' },
};

// Must match the password formula used in SeedPage.jsx's getOrCreateAuthUserId
const demoAuthPassword = email =>
  email.replace('@demo.com', '').replace(/[^a-zA-Z0-9]/g, '') + '_EmbarkGCC2025!';

// Establish a real Supabase auth session for a demo user so that
// RLS-protected table reads work correctly in the store.
async function signInToSupabase(email) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: demoAuthPassword(email),
  });
  return !error;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore a saved demo session
    const savedDemoUser = localStorage.getItem('gcc_demo_user');
    if (savedDemoUser) {
      const u = JSON.parse(savedDemoUser);
      setUser(u);
      // Re-establish Supabase auth JWT so store queries pass RLS on page refresh
      signInToSupabase(u.email)
        .then(() => store.reload())
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    // Otherwise check for an existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Don't override a demo session that's already active
        if (!localStorage.getItem('gcc_demo_user')) {
          fetchUserProfile(session.user);
        }
      } else {
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
      store.reload();
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        role: authUser.user_metadata?.role || 'Client',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      const base = DEMO_USERS[email];

      // Establish a real Supabase auth session so RLS-protected queries work
      await signInToSupabase(email).catch(() => {});

      // Fetch DB profile for assigned_project_id and the real DB-generated id
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', base.email)
        .single();

      const fullUser = { ...base, ...(profile || {}), id: profile?.id };
      localStorage.setItem('gcc_demo_user', JSON.stringify(fullUser));
      setUser(fullUser);
      store.reload();
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
      options: { data: metadata },
    });
    if (error) throw error;
    return { data, error: null };
  };

  const logout = async () => {
    localStorage.removeItem('gcc_demo_user');
    await supabase.auth.signOut();
    setUser(null);
    store.data = Object.keys(store.data).reduce((acc, k) => { acc[k] = []; return acc; }, {});
    store.initialized = false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session: user,
      currentUser: user,
      signIn,
      signUp,
      logout,
      loading,
      isLoading: loading,
      isPMO: user?.role === 'PMO',
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
