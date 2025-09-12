import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import TimeTracker from './TimeTracker';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onSignOut: () => Promise<void>;
  totalTimeSaved: number;
}

const SidebarLayout = ({ children, onSignOut, totalTimeSaved }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onSignOut={onSignOut} />
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-end gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
              <TimeTracker totalTimeSaved={totalTimeSaved} />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;