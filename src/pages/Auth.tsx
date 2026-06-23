import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/shared/ImageUpload";
import { Sparkles, ShieldCheck, Gem } from "lucide-react";
import goldLogo from "@/assets/gold-logo.png";

const Auth = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      toast({ title: "Reset Link Sent", description: "Check your email for a password reset link." });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, fullName, shopName, ownerName, phone, logoUrl, address);
      toast({ title: "Account Created", description: "Your shop registration is pending admin approval." });
    } catch (err: any) {
      toast({ title: "Signup Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Decorative blurred orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative p-12 flex-col justify-between text-amber-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-2 ring-amber-300/40">
            <img src={goldLogo} alt="Gold ERP" className="w-10 h-10 object-contain" width={512} height={512} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide">Gold Jewellery ERP</h1>
            <p className="text-xs text-amber-200/80">Premium Business Suite</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">
            <span className="text-gradient-gold">Manage your gold business</span>
            <br />with elegance & precision.
          </h2>
          <p className="text-amber-100/80 leading-relaxed">
            Tola-based pricing, real-time inventory, customer ledgers, and beautiful invoices —
            all crafted for jewellers.
          </p>

          <div className="space-y-3 pt-4">
            {[
              { icon: Gem, text: "Tola gold rate pricing with polish/waste" },
              { icon: ShieldCheck, text: "Secure customer ledgers & repayment alerts" },
              { icon: Sparkles, text: "Branded invoices and printable reports" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400/20 flex items-center justify-center ring-1 ring-amber-300/30">
                  <f.icon className="w-4 h-4 text-amber-300" />
                </div>
                <p className="text-sm text-amber-100/90">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-amber-200/60">© {new Date().getFullYear()} Gold Jewellery ERP. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <Card className="w-full max-w-md border-amber-500/20 shadow-2xl backdrop-blur bg-card/95">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold ring-4 ring-amber-200/50 mb-3">
                <img src={goldLogo} alt="Gold ERP" className="w-16 h-16 object-contain" width={512} height={512} />
              </div>
              <h2 className="text-2xl font-extrabold text-gradient-gold">Gold Jewellery ERP</h2>
              <p className="text-xs text-muted-foreground mt-1">Sign in to your premium business panel</p>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 bg-amber-500/10 p-1 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-gold data-[state=active]:text-amber-950 data-[state=active]:shadow">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-gradient-gold data-[state=active]:text-amber-950 data-[state=active]:shadow">Register Shop</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4 mt-5">
                    <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a password reset link.</p>
                    <Input placeholder="Email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="h-11" />
                    <Button type="submit" className="w-full h-11 bg-gradient-gold text-amber-950 font-bold hover:opacity-95 hover:shadow-gold transition-all" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-amber-600 hover:text-amber-500 hover:underline transition-colors">
                      Back to Login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4 mt-5">
                    <Input placeholder="Email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-11" />
                    <Input placeholder="Password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-11" />
                    <Button type="submit" className="w-full h-11 bg-gradient-gold text-amber-950 font-bold hover:opacity-95 hover:shadow-gold transition-all" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-amber-600 hover:text-amber-500 hover:underline transition-colors">
                      Forgot Password?
                    </button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3 mt-5">
                  <div className="flex flex-col items-center gap-1">
                    <ImageUpload currentUrl={logoUrl} onUpload={(url) => setLogoUrl(url)} folder="shop-logos" />
                    <p className="text-[11px] text-muted-foreground">Shop Logo / Profile Picture</p>
                  </div>
                  <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  <Input placeholder="Email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  <Input placeholder="Password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required />
                  <Input placeholder="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} required />
                  <Input placeholder="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
                  <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Textarea placeholder="Shop Address" value={address} onChange={e => setAddress(e.target.value)} rows={2} />
                  <Button type="submit" className="w-full h-11 bg-gradient-gold text-amber-950 font-bold hover:opacity-95 hover:shadow-gold transition-all" disabled={loading}>
                    {loading ? "Registering..." : "Register Shop"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
