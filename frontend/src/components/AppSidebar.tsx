import { useState, useEffect } from "react";
import { 
  Home, 
  Plus, 
  Settings, 
  LogOut, 
  Link2, 
  Wallet, 
  Bell, 
  HelpCircle,
  Heart,
  Sun,
  Moon
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/MockAuthContext";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/app", icon: Home },
  { title: "My Links", url: "/my-links", icon: Link2 },
  { title: "Create Link", url: "/create", icon: Plus },
  { title: "Contributions", url: "/contributions", icon: Heart },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);
  
  // Mock user data
  const username = "demo_user";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-56"}
      collapsible="icon"
    >
      <SidebarContent className="bg-primary text-primary-foreground">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <img src={logo} alt="Crowd Pay" className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-bold text-lg text-primary-foreground">Crowd Pay</span>
          )}
        </div>

        {/* Navigation Items */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                      className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                      activeClassName="bg-primary-foreground text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Section */}
        <SidebarGroup className="mt-auto border-t border-primary-foreground/20">
          <SidebarGroupContent className="py-4">
            <SidebarMenu>
              {/* Light/Dark Mode Toggle */}
              {!isCollapsed && mounted && (
                <SidebarMenuItem>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      {resolvedTheme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      <span className="text-sm">{resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                    </div>
                    <Switch
                      checked={resolvedTheme === "light"}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-primary-foreground/30"
                    />
                  </div>
                </SidebarMenuItem>
              )}

              {/* Logout Button */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={signOut} 
                  className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-3">Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}