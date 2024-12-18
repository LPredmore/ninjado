import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPinVerified: () => void;
  mode: 'set' | 'verify';
  currentPin?: string;
}

const PinDialog = ({ isOpen, onClose, onPinVerified, mode, currentPin }: PinDialogProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSubmit = () => {
    if (mode === 'set') {
      if (pin.length < 4) {
        toast.error('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      onPinVerified();
    } else {
      if (pin === currentPin) {
        onPinVerified();
      } else {
        toast.error('Incorrect PIN');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'set' ? 'Set Routines PIN' : 'Enter PIN'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {mode === 'set' ? 'New PIN' : 'Enter PIN'}
            </label>
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
            />
          </div>
          {mode === 'set' && (
            <div>
              <label className="text-sm font-medium">Confirm PIN</label>
              <Input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={6}
                pattern="[0-9]*"
              />
            </div>
          )}
          <Button 
            className="w-full"
            onClick={handleSubmit}
          >
            {mode === 'set' ? 'Set PIN' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDialog;