import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";

const PendingApproval = () => {
  const { signOut, businessStatus } = useAuth();

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
        <CardContent>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
