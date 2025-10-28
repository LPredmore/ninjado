import { NavLink, useLocation } from "react-router-dom";
import { Target, Settings, Gift, HelpCircle, User, LogOut, Shield, Menu } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  {
    title: "Execute Routines",
    url: "/",
    icon: Target,
  },
  {
    title: "Routines",
    url: "/routines",
    icon: Settings,
  },
  {
    title: "Rewards",
    url: "/rewards", 
    icon: Gift,
  },
  {
    title: "Parents",
    url: "/parent",
    icon: Shield,
  },
  {
    title: "How to Use",
    url: "/how-to-use",
    icon: HelpCircle,
  },
];

interface AppSidebarProps {
  onSignOut: () => Promise<void>;
}

export function AppSidebar({ onSignOut }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "clay-element gradient-clay-accent text-accent-foreground font-bold glow-jade" 
      : "rounded-xl transition-clay hover:bg-accent/20 hover:text-accent-foreground clay-hover";
  };

  return (
    <Sidebar 
      className="border-r border-border/50" 
      collapsible="icon"
      variant={isMobile ? "floating" : "sidebar"}
    >
      <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="clay-element w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden glow-jade">
              <img 
                src="/lovable-uploads/3b625771-568e-4e81-9f85-dd2963292f55.png" 
                alt="NinjaDo Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  NinjaDo
                </h2>
                <p className="text-sm text-cyan-300/80 font-medium">Master Your Routine</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className={getNavClassName(item.url)}
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/profile"
                  className={getNavClassName("/profile")}
                >
                  <User className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">Profile</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          {!collapsed && (
            <>
              <Separator className="my-3 bg-border/50" />
              <Button
                variant="smoke-bomb"
                size="sm"
                onClick={onSignOut}
                className="w-full justify-start text-destructive hover:glow-fire"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Dojo
              </Button>
            </>
          )}
          
          {collapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button 
                  onClick={onSignOut}
                  className="clay-element rounded-xl w-full text-destructive hover:glow-fire clay-hover clay-press"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarFooter>
    </Sidebar>
  );
}