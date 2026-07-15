import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "business_admin" | "staff";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  businessId: string | null;
  businessStatus: string | null;
  shopName: string | null;
  ownerName: string | null;
  shopLogo: string | null;
  shopAddress: string | null;
  shopPhone: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, shopName: string, ownerName: string, phone: string, logoUrl?: string, address?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshBusiness: (patch?: { shopName?: string; ownerName?: string; shopLogo?: string | null; shopAddress?: string | null; shopPhone?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessStatus, setBusinessStatus] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [shopAddress, setShopAddress] = useState<string | null>(null);
  const [shopPhone, setShopPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role, business_id")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      setRole(roles[0].role as AppRole);
      setBusinessId(roles[0].business_id);

      if (roles[0].business_id) {
        const { data: biz } = await (supabase
          .from("businesses")
          .select("status, shop_name, owner_name, logo_url, address, phone") as any)
          .eq("id", roles[0].business_id)
          .maybeSingle();
        setBusinessStatus(biz?.status || null);
        setShopName(biz?.shop_name || null);
        setOwnerName(biz?.owner_name || null);
        setShopLogo(biz?.logo_url || null);
        setShopAddress(biz?.address || null);
        setShopPhone(biz?.phone || null);
      }
    } else {
      const { data: biz } = await (supabase
        .from("businesses")
        .select("id, status, shop_name, owner_name, logo_url, address, phone") as any)
        .eq("user_id", userId);

      if (biz && biz.length > 0) {
        setBusinessId(biz[0].id);
        setBusinessStatus(biz[0].status);
        setShopName(biz[0].shop_name);
        setOwnerName(biz[0].owner_name);
        setShopLogo(biz[0].logo_url || null);
        setShopAddress(biz[0].address || null);
        setShopPhone(biz[0].phone || null);
        setRole("business_admin");
      }
    }
  };

  const refreshBusiness = async (patch?: { shopName?: string; ownerName?: string; shopLogo?: string | null; shopAddress?: string | null; shopPhone?: string | null }) => {
    if (patch) {
      if (patch.shopName   !== undefined) setShopName(patch.shopName);
      if (patch.ownerName  !== undefined) setOwnerName(patch.ownerName);
      if (patch.shopLogo   !== undefined) setShopLogo(patch.shopLogo);
      if (patch.shopAddress !== undefined) setShopAddress(patch.shopAddress);
      if (patch.shopPhone  !== undefined) setShopPhone(patch.shopPhone);
    } else {
      if (user) await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          await fetchUserData(session.user.id);
          setLoading(false);
        }, 0);
      } else {
        setRole(null);
        setBusinessId(null);
        setBusinessStatus(null);
        setShopName(null);
        setOwnerName(null);
        setShopLogo(null);
        setShopAddress(null);
        setShopPhone(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, shopNameVal: string, ownerNameVal: string, phone: string, logoUrl?: string, address?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");

    const { data: biz, error: bizErr } = await (supabase.from("businesses") as any).insert({
      user_id: data.user.id,
      shop_name: shopNameVal,
      owner_name: ownerNameVal,
      phone,
      logo_url: logoUrl || null,
      address: address || null,
      status: "pending",
    }).select().single();
    if (bizErr) throw bizErr;

    await supabase.from("user_roles").insert({
      user_id: data.user.id,
      role: "business_admin" as any,
      business_id: biz.id,
    });

    setBusinessId(biz.id);
    setBusinessStatus("pending");
    setShopName(shopNameVal);
    setOwnerName(ownerNameVal);
    setShopLogo(logoUrl || null);
    setShopAddress(address || null);
    setShopPhone(phone || null);
    setRole("business_admin");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setBusinessId(null);
    setBusinessStatus(null);
    setShopName(null);
    setOwnerName(null);
    setShopLogo(null);
    setShopAddress(null);
    setShopPhone(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, businessId, businessStatus, shopName, ownerName, shopLogo, shopAddress, shopPhone, loading, signUp, signIn, signOut, resetPassword, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
