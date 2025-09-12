import { NavLink, useLocation } from "react-router-dom";
import { Target, Settings, Gift, HelpCircle, User, LogOut } from "lucide-react";
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
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-accent hover:text-accent-foreground";
  };

  return (
    <Sidebar className="border-r bg-card">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">🥷</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg">NinjaDo</h2>
              <p className="text-sm text-muted-foreground">Productivity Dojo</p>
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
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
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
                <User className="w-4 h-4" />
                {!collapsed && <span>Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {!collapsed && (
          <>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
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
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}