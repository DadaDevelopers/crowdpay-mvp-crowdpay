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
  Moon,
  Compass
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-56"}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <img src={logo} alt="Crowd Pay" className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">Crowd Pay</span>
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
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
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
        <SidebarGroup className="mt-auto border-t border-sidebar-border">
          <SidebarGroupContent className="py-4">
            <SidebarMenu>
              {/* Light/Dark Mode Toggle */}
              {!isCollapsed && mounted && (
                <SidebarMenuItem>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 text-sidebar-foreground/80">
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
                      className="data-[state=checked]:bg-sidebar-foreground/30"
                    />
                  </div>
                </SidebarMenuItem>
              )}

              {/* Logout Button */}
              <SidebarMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SidebarMenuButton
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-3">Logout</span>}
                    </SidebarMenuButton>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to sign out?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be redirected to the home page and will need to sign in again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
