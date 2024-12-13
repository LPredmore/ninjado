import React from 'react';
import { Menu } from "lucide-react";
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
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-ninja-text">Task Ninja</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Routines</DropdownMenuItem>
            <DropdownMenuItem>Rewards</DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-gray-600">Complete your routines like a ninja!</p>
    </div>
  );
};

export default Header;