import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string, token?: string) => Promise<{error: Error | null}>;
  signUp: (email: string, password: string, token?: string, metadata?: { full_name?: string, avatar_url?: string }) => Promise<{error: Error | null}>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostAuthNavigation = (token?: string) => {
    // If there's a token parameter, redirect to scan page
    if (token) {
      console.log("Post-auth navigation with token:", token);
      navigate(`/scan?token=${encodeURIComponent(token)}`);
    } else {
      // Otherwise go to dashboard
      navigate("/dashboard");
    }
  };

  const signIn = async (email: string, password: string, token?: string) => {
    try {
      console.log("Signing in with token param:", token);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        handlePostAuthNavigation(token);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, token?: string, metadata?: { full_name?: string, avatar_url?: string }) => {
    try {
      console.log("Signing up with token param:", token);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (!error) {
        handlePostAuthNavigation(token);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
