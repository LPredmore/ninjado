import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, X, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PinPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  userId: string;
}

const PinPrompt = ({ isOpen, onClose, onSuccess, title, description, userId }: PinPromptProps) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedPin = localStorage.getItem(`ninja_pin_${userId}`);
    
    if (!storedPin) {
      // No PIN set, allow access
      onSuccess();
      return;
    }
    
    if (pin === storedPin) {
      onSuccess();
      setPin('');
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect PIN. Only parents can access this feature.",
        variant: "destructive"
      });
      setPin('');
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="clay-element max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl clay-element flex items-center justify-center glow-fire">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                {title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Enter Parental PIN
            </label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="Enter PIN"
                className="pr-10 text-center text-lg tracking-widest"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="clay-jade"
              className="flex-1"
            >
              <Shield className="w-4 h-4 mr-2" />
              Authorize
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
          🥷 This is a secured ninja zone. Only parents with the correct PIN can proceed.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinPrompt;