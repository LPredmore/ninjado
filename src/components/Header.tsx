import React from 'react';
import { Button } from "@/components/ui/button";
import { SupabaseClient } from '@supabase/supabase-js';

interface HeaderProps {
  onSignOut: () => Promise<void>;
}

const Header = ({ onSignOut }: HeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-ninja-text">Task Ninja</h1>
        <p className="text-gray-600">Complete your morning routine like a ninja!</p>
      </div>
      <Button onClick={onSignOut} variant="outline">
        Sign Out
      </Button>
    </div>
  );
};

export default Header;