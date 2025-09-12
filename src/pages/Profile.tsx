import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { NinjaScrollCard } from "@/components/ninja/NinjaScrollCard";
import { Mail, Lock, Crown, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProfileProps {
  user: User;
  supabase: SupabaseClient;
}

const Profile = ({ user, supabase }: ProfileProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { totalTimeSaved } = useTimeTracking();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpgradeToPremium = () => {
    window.open('https://buy.stripe.com/fZedRM7Co6Qe2qc144', '_blank');
  };

  const handleSendMessage = () => {
    navigate('/contact');
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 max-w-3xl space-y-8">
        
        {/* Profile Header */}
        <div className="text-center">
          <div className="clay-element w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
            <img 
              src="/lovable-uploads/4b52c6af-f31e-4e1e-b212-c7b79a00f888.png" 
              alt="Ninja Avatar"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Ninja Profile
          </h1>
          <p className="text-muted-foreground">Manage your dojo settings</p>
        </div>

        {/* Account Information */}
        <NinjaScrollCard title="🔧 Account Settings" variant="default">
          <div className="space-y-6">
            {/* Email Display */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-foreground font-medium">
                <Mail className="w-4 h-4 text-accent" />
                Email Address
              </Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="clay-element bg-muted/50 border-border/50"
              />
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-foreground font-medium">
                <Lock className="w-4 h-4 text-accent" />
                Change Password
              </Label>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="clay-element"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="clay-element"
                />
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={!newPassword || !confirmPassword || isUpdatingPassword}
                  variant="clay-jade"
                  className="w-full"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
        </NinjaScrollCard>

        {/* Subscription Status */}
        <NinjaScrollCard title="👑 Subscription Status" variant="default">
          <div className="space-y-6">
            
            {/* Free Account Status */}
            <div className="clay-element p-6 bg-muted/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="clay-element w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm">🆓</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">Free Account</h3>
              </div>
              
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span>1 Routine at a time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span>Basic Support</span>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button 
              onClick={handleUpgradeToPremium}
              variant="clay-electric" 
              size="lg"
              className="w-full glow-electric"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Unlock unlimited routines and premium features
            </p>
          </div>
        </NinjaScrollCard>

        {/* Questions or Suggestions */}
        <NinjaScrollCard title="💬 Questions or Suggestions?" variant="default">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              We'd love to hear from you! Whether you have an idea for a new feature or need help with something, feel free to reach out.
            </p>
            <Button 
              onClick={handleSendMessage}
              variant="ninja-scroll" 
              size="lg"
              className="w-full"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Send us a message
            </Button>
          </div>
        </NinjaScrollCard>

      </div>
    </SidebarLayout>
  );
};

export default Profile;