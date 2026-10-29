import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import ImageUpload from "@/components/shared/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Store, User, Phone, MapPin, Image, CheckCircle2, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const Settings = () => {
  const { businessId, user, refreshBusiness } = useAuth();
  const { toast } = useToast();

  // --- Change password (self-service for the signed-in user) ---
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const setPwField = (field: "current" | "next" | "confirm", value: string) =>
    setPw(p => ({ ...p, [field]: value }));

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    if (pw.next.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (pw.next !== pw.confirm) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }

    setPwSaving(true);

    // Re-authenticate with the current password before allowing a change.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pw.current,
    });
    if (signInError) {
      toast({ title: "Current password is incorrect", description: signInError.message, variant: "destructive" });
      setPwSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
      setPwSaving(false);
      return;
    }

    setPw({ current: "", next: "", confirm: "" });
    toast({ title: "Password changed", description: "Your password has been updated." });
    setPwSaving(false);
  };

  const [form, setForm] = useState({
    shop_name: "",
    owner_name: "",
    phone: "",
    address: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load directly from DB — never trust auth context timing for initial form values
  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase
        .from("businesses")
        .select("shop_name, owner_name, phone, address, logo_url") as any)
        .eq("id", businessId)
        .maybeSingle();
      if (data) {
        setForm({
          shop_name: data.shop_name || "",
          owner_name: data.owner_name || "",
          phone: data.phone || "",
          address: data.address || "",
          logo_url: data.logo_url || "",
        });
      }
      setLoading(false);
    })();
  }, [businessId]);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const saveToDb = async (patch: Record<string, any>) => {
    const { error } = await (supabase.from("businesses") as any)
      .update(patch)
      .eq("id", businessId);
    return error;
  };

  const reloadFromDb = async () => {
    const { data } = await (supabase
      .from("businesses")
      .select("shop_name, owner_name, phone, address, logo_url") as any)
      .eq("id", businessId)
      .maybeSingle();
    return data;
  };

  // Auto-save logo the moment it's uploaded — don't make user click Save
  const handleLogoUpload = async (url: string) => {
    set("logo_url", url);
    if (!businessId) return;
    setLogoSaving(true);
    const error = await saveToDb({ logo_url: url });
    if (error) {
      toast({ title: "Logo save failed", description: error.message, variant: "destructive" });
    } else {
      await refreshBusiness({ shopLogo: url });
      toast({ title: "Logo saved and applied" });
    }
    setLogoSaving(false);
  };

  const handleSave = async () => {
    if (!businessId) return;
    if (!form.shop_name.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      shop_name: form.shop_name.trim(),
      owner_name: form.owner_name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      logo_url: form.logo_url.trim() || null,
    };

    const error = await saveToDb(payload);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Reload separately to confirm what was actually written
    const data = await reloadFromDb();
    if (data) {
      setForm({
        shop_name: data.shop_name || "",
        owner_name: data.owner_name || "",
        phone: data.phone || "",
        address: data.address || "",
        logo_url: data.logo_url || "",
      });
    }
    await refreshBusiness({
      shopName:    payload.shop_name   || null,
      ownerName:   payload.owner_name  || null,
      shopLogo:    payload.logo_url    ?? null,
      shopAddress: payload.address     ?? null,
      shopPhone:   payload.phone       ?? null,
    });
    setSaved(true);
    toast({ title: "Settings saved and applied" });
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Shop Settings</h1>
          <p className="text-sm text-muted-foreground">Changes apply instantly everywhere — invoices, reports, and headers</p>
        </div>

        {/* Logo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Shop Logo
              {logoSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <ImageUpload
                currentUrl={form.logo_url}
                onUpload={handleLogoUpload}
                folder="logos"
                size="lg"
              />
              {logoSaving && (
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Or paste an image URL directly</Label>
              <Input
                placeholder="https://example.com/logo.png"
                value={form.logo_url}
                onChange={e => set("logo_url", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Uploading via the circle auto-saves immediately. Pasting a URL requires clicking Save below.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Shop Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" />
                  Shop Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Yaqoob Jewellers"
                  value={form.shop_name}
                  onChange={e => set("shop_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Owner / Manager Name
                </Label>
                <Input
                  placeholder="e.g. Haji Muhammad Yaqoob"
                  value={form.owner_name}
                  onChange={e => set("owner_name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Phone / Mobile
              </Label>
              <Input
                placeholder="e.g. 0300-1234567"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Shop Address
              </Label>
              <Textarea
                placeholder="e.g. Shop #5, Gold Market, Karkhano, Peshawar"
                value={form.address}
                onChange={e => set("address", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        {(form.shop_name || form.logo_url) && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Invoice Header Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    className="w-12 h-12 rounded-lg object-cover border shrink-0"
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div>
                  <p className="font-extrabold text-base text-primary uppercase tracking-wide">{form.shop_name || "Shop Name"}</p>
                  {form.owner_name && <p className="text-sm font-semibold text-muted-foreground">{form.owner_name}</p>}
                  {form.phone && <p className="text-xs text-muted-foreground">Cell: {form.phone}</p>}
                  {form.address && <p className="text-xs text-muted-foreground">{form.address}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.email && (
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm">Current Password</Label>
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Enter current password"
                value={pw.current}
                onChange={e => setPwField("current", e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">New Password</Label>
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={pw.next}
                  onChange={e => setPwField("next", e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Confirm New Password</Label>
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={pw.confirm}
                  onChange={e => setPwField("confirm", e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 self-start text-muted-foreground"
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPw ? "Hide" : "Show"} passwords
              </Button>
              <Button
                type="button"
                className="gap-2 sm:ml-auto"
                onClick={handleChangePassword}
                disabled={pwSaving || !pw.current || !pw.next || !pw.confirm}
              >
                {pwSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                  : <><Lock className="w-4 h-4" /> Change Password</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleSave}
          disabled={saving || logoSaving}
        >
          {saved
            ? <><CheckCircle2 className="w-4 h-4" /> Saved & Applied</>
            : saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Settings</>
          }
        </Button>
      </div>
    </AppLayout>
  );
};

export default Settings;
