import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";

const PendingApproval = () => {
  const { signOut, businessStatus, user, role, businessId } = useAuth();

  // Live ground truth for THIS exact session, queried fresh right here —
  // independent of whatever AuthContext computed. If these disagree with
  // what the app "sees" above, that mismatch itself is the bug to chase.
  const [liveRoles, setLiveRoles] = useState<any[] | null>(null);
  const [liveBiz, setLiveBiz] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: roles } = await (supabase.from("user_roles").select("*") as any).eq("user_id", user.id);
      const { data: biz } = await (supabase.from("businesses").select("id, status, shop_name, user_id") as any).eq("user_id", user.id);
      setLiveRoles(roles || []);
      setLiveBiz(biz || []);
    })();
  }, [user?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            {businessStatus === "rejected" ? (
              <span className="text-3xl">❌</span>
            ) : (
              <Clock className="w-8 h-8 text-warning" />
            )}
          </div>
          <CardTitle className="text-xl">
            {businessStatus === "rejected" ? "Registration Rejected" : "Waiting for Admin Approval"}
          </CardTitle>
          <CardDescription>
            {businessStatus === "rejected"
              ? "Your shop registration has been rejected. Please contact the administrator."
              : "Your shop registration is being reviewed. You'll be able to access the dashboard once approved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>

          {liveRoles !== null && (
            <div className="text-left text-xs bg-muted/40 rounded-lg p-3 space-y-1 break-all">
              <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Diagnostic Info — share this if stuck</p>
              <p><strong>Login:</strong> {user?.email}</p>
              <p><strong>Auth ID:</strong> {user?.id}</p>
              <p><strong>App resolved:</strong> role={role || "none"}, businessId={businessId || "none"}, status={businessStatus || "none"}</p>
              <p className="pt-1"><strong>Live user_roles rows for this login ({liveRoles.length}):</strong></p>
              {liveRoles.length === 0 && <p className="pl-3 text-destructive">— none found —</p>}
              {liveRoles.map((r: any) => (
                <p key={r.id} className="pl-3">role={r.role}, business_id={r.business_id || "null"}</p>
              ))}
              <p className="pt-1"><strong>Live businesses owned by this login ({(liveBiz || []).length}):</strong></p>
              {(liveBiz || []).length === 0 && <p className="pl-3 text-destructive">— none found —</p>}
              {(liveBiz || []).map((b: any) => (
                <p key={b.id} className="pl-3">{b.shop_name} — status={b.status} — id={b.id}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
