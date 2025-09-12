import React, { useState, useEffect } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { toast } from '@/hooks/use-toast';
interface ParentProps {
  user: User;
  supabase: SupabaseClient;
}
const Parent = ({
  user,
  supabase
}: ParentProps) => {
  const {
    totalTimeSaved
  } = useTimeTracking();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  useEffect(() => {
    // Check if PIN exists in localStorage
    const storedPin = localStorage.getItem(`ninja_pin_${user.id}`);
    setHasPin(!!storedPin);
  }, [user.id]);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  const handleSetPin = () => {
    if (newPin.length < 4) {
      toast({
        title: "PIN Too Short",
        description: "PIN must be at least 4 digits long.",
        variant: "destructive"
      });
      return;
    }
    if (newPin !== confirmPin) {
      toast({
        title: "PINs Don't Match",
        description: "Please ensure both PIN entries match.",
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem(`ninja_pin_${user.id}`, newPin);
    setHasPin(true);
    setNewPin('');
    setConfirmPin('');
    toast({
      title: "Parental Controls Activated",
      description: "PIN has been set successfully. Security protocols are now active."
    });
  };
  const handleRemovePin = () => {
    localStorage.removeItem(`ninja_pin_${user.id}`);
    setHasPin(false);
    setCurrentPin('');
    toast({
      title: "Parental Controls Deactivated",
      description: "PIN has been removed. All restrictions are lifted."
    });
  };
  return <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl clay-element flex items-center justify-center glow-jade">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Parental Control Center
              </h1>
              <p className="text-muted-foreground">Secure training environment management</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* PIN Status Card */}
          <Card className="clay-element">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasPin ? <Lock className="w-5 h-5 text-green-500" /> : <Unlock className="w-5 h-5 text-orange-500" />}
                Security Status
              </CardTitle>
              <CardDescription>
                {hasPin ? "Parental controls are ACTIVE. PIN required for restricted actions." : "No parental controls set. All features are unrestricted."}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* PIN Management */}
          {!hasPin ? <Card className="clay-element">
              <CardHeader>
                <CardTitle>Set Parental PIN</CardTitle>
                <CardDescription>
                  Create a PIN to restrict access to training controls and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input type={showPin ? "text" : "password"} placeholder="Enter new PIN (minimum 4 digits)" value={newPin} onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} className="pr-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowPin(!showPin)}>
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="relative">
                  <Input type={showPin ? "text" : "password"} placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} />
                </div>
                <Button onClick={handleSetPin} className="w-full" variant="clay-jade">
                  <Shield className="w-4 h-4 mr-2" />
                  Activate Parental Controls
                </Button>
              </CardContent>
            </Card> : <Card className="clay-element">
              <CardHeader>
                <CardTitle>PIN Management</CardTitle>
                <CardDescription>
                  Parental controls are currently active
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRemovePin} variant="destructive" className="w-full">
                  <Unlock className="w-4 h-4 mr-2" />
                  Remove PIN & Deactivate Controls
                </Button>
              </CardContent>
            </Card>}

          {/* Information Cards */}
          <Card className="clay-element">
            <CardHeader>
              <CardTitle>What gets protected?</CardTitle>
              <CardDescription>
                When a PIN is set, these actions require parental authorization:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Training Controls</p>
                  <p className="text-sm text-muted-foreground">Pause/Resume training sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Task Management</p>
                  <p className="text-sm text-muted-foreground">Adding temporary tasks during training</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Routine Configuration</p>
                  <p className="text-sm text-muted-foreground">Access to the Routines page for editing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Parental Settings</p>
                  <p className="text-sm text-muted-foreground">Access to this parent control page</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-element border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
            
            
          </Card>
        </div>
      </div>
    </SidebarLayout>;
};
export default Parent;