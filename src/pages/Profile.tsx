import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { NinjaScrollCard } from "@/components/ninja/NinjaScrollCard";
import { Mail, Lock, Crown, MessageSquare, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileProps {
  user: User;
  supabase: SupabaseClient;
}

const Profile = ({ user, supabase }: ProfileProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { totalTimeSaved } = useTimeTracking();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_end')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          const isActive = data.subscribed && 
            (!data.subscription_end || new Date(data.subscription_end) > new Date());
          setHasActiveSub(isActive);
        }
      } catch (error) {
        console.log("No subscription found");
      } finally {
        setIsLoadingSub(false);
      }
    };

    if (user?.id) {
      checkSubscription();
    }
  }, [user?.id, supabase]);

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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    
    try {
      // Step 1: Delete all user data from related tables
      await supabase.from('reward_redemptions').delete().eq('user_id', user.id);
      await supabase.from('rewards').delete().eq('user_id', user.id);
      await supabase.from('routines').delete().eq('user_id', user.id);
      await supabase.from('task_completions').delete().eq('user_id', user.id);
      await supabase.from('parental_controls').delete().eq('user_id', user.id);
      await supabase.from('subscribers').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Step 2: Delete the auth user
      const { error: authError } = await supabase.rpc('delete_user');
      
      if (authError) {
        toast.error("Failed to delete account. Please contact support.");
        setIsDeletingAccount(false);
        return;
      }
      
      // Step 3: Show success message and redirect
      toast.success("Your account has been permanently deleted");
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An error occurred while deleting your account");
      setIsDeletingAccount(false);
    }
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 max-w-3xl space-y-8">
        
        {/* Profile Header */}
        <div className="text-center">
          <div className="clay-element w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
            <img 
              src="/lovable-uploads/3b625771-568e-4e81-9f85-dd2963292f55.png" 
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

        {/* Subscription Status - Only show for free users */}
        {!isLoadingSub && !hasActiveSub && (
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
        )}

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

        {/* Delete Account - Danger Zone */}
        <NinjaScrollCard title="⚠️ Danger Zone" variant="default">
          <div className="space-y-4 border border-destructive/50 rounded-lg p-4 bg-destructive/5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive" 
              size="lg"
              className="w-full"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete My Account
            </Button>
          </div>
        </NinjaScrollCard>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Delete Account Permanently?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="font-medium">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All your routines and tasks</li>
                  <li>All your rewards and redemption history</li>
                  <li>Your parental control settings</li>
                  <li>Your time tracking data</li>
                  <li>Your account and profile information</li>
                </ul>
                <p className="text-destructive font-semibold pt-2">
                  This action cannot be reversed!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex items-start space-x-2 py-4">
              <Checkbox
                id="delete-confirm"
                checked={deleteConfirmation}
                onCheckedChange={(checked) => setDeleteConfirmation(checked as boolean)}
              />
              <label
                htmlFor="delete-confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this action is permanent and cannot be undone
              </label>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteConfirmation(false);
                setShowDeleteDialog(false);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmation || isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount ? "Deleting..." : "Delete My Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Privacy & Terms Footer */}
        <div className="text-center py-4">
          <a 
            href="https://bestselfs.com/data" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Privacy & Terms
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </SidebarLayout>
  );
};

export default Profile;