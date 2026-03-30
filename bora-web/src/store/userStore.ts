import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  plan: "free" | "pro" | "lab";
  fullName: string;
}

interface UserState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, plan")
      .eq("id", userId)
      .single();
    if (data) {
      set({
        user: {
          id: data.id,
          email: data.email,
          role: data.role,
          plan: data.plan,
          fullName: data.full_name || "",
        },
        isAuthenticated: true,
      });
    }
  },
}));
