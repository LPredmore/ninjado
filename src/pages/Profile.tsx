import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { Mail, User as UserIcon } from "lucide-react";

interface ProfileProps {
  user: User;
  supabase: SupabaseClient;
}

const Profile = ({ user, supabase }: ProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { totalTimeSaved } = useTimeTracking();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed at this time
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={user.id}
                disabled
                className="bg-muted font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(user.created_at || "").toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Profile;