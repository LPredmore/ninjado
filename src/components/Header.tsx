import React from 'react';
import { Menu } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSignOut: () => Promise<void>;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-ninja-text">NinjaDo</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/')}>Dashboard</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/routines')}>Routines</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/rewards')}>Rewards</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/how-to-use')}>How to Use</DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-gray-600">Complete your routines like a ninja!</p>
    </div>
  );
};

export default Header;