// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define o tipo para o nosso contexto
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor" do contexto
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta obter a sessão existente quando o app carrega
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Ouve mudanças no estado de autenticação (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Limpa o listener quando o componente é desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
  };

  // Fornece o contexto para os componentes filhos
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Hook personalizado para facilitar o uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};