import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import TimeTracker from './TimeTracker';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onSignOut: () => Promise<void>;
  totalTimeSaved: number;
}

const SidebarLayout = ({ children, onSignOut, totalTimeSaved }: SidebarLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onSignOut={onSignOut} />
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
              {isMobile && (
                <SidebarTrigger className="clay-element rounded-xl p-2 text-foreground hover:bg-accent/20" />
              )}
              <div className="flex-1 flex justify-end">
                <TimeTracker totalTimeSaved={totalTimeSaved} />
              </div>
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