import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import goldLogo from "@/assets/gold-logo.png";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password Updated", description: "Your password has been reset successfully." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-amber-500/20 shadow-2xl backdrop-blur bg-card/95">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold ring-4 ring-amber-200/50 mb-3">
              <img src={goldLogo} alt="Gold ERP" className="w-16 h-16 object-contain" width={512} height={512} />
            </div>
            <h2 className="text-2xl font-extrabold text-gradient-gold">Reset Password</h2>
            <p className="text-xs text-muted-foreground mt-1">Enter your new password below</p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <Input placeholder="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11" />
            <Input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11" />
            <Button type="submit" className="w-full h-11 bg-gradient-gold text-amber-950 font-bold hover:opacity-95 hover:shadow-gold transition-all" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
