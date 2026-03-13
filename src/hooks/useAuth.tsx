import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { setLanguageFromProfile } from "@/i18n";

type Profile = Tables<"profiles">;
type AppRole = "user" | "admin" | "super_admin";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: "user",
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  isAdmin: () => false,
  isSuperAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    // Check plan expiration — downgrade to free if expired
    if (data && data.plan !== "free" && data.plan_expires_at) {
      const expiresAt = new Date(data.plan_expires_at);
      if (expiresAt < new Date()) {
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("user_id", userId);
        setProfile({ ...data, plan: "free" as any, plan_expires_at: null });
        return;
      }
    }
    setProfile(data);
    // Set UI language from profile preference
    if (data) {
      setLanguageFromProfile((data as any).language);
    }
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (data && data.length > 0) {
      // Pick highest role
      const roles = data.map((r: any) => r.role as AppRole);
      if (roles.includes("super_admin")) setRole("super_admin");
      else if (roles.includes("admin")) setRole("admin");
      else setRole("user");
    } else {
      setRole("user");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRole(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole("user");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole("user");
  };

  const isAdmin = () => role === "admin" || role === "super_admin";
  const isSuperAdmin = () => role === "super_admin";

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, refreshProfile, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
