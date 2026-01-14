import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, ChevronDown, Home, Compass, Link2, Plus, Heart, Wallet, Settings, HelpCircle, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/MockAuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
} from '@/components/ui/alert-dialog'

const navItems = [
  { title: "Dashboard", url: "/app", icon: Home },
  { title: "Explore Events", url: "/explore", icon: Compass },
  { title: "My Events", url: "/my-links", icon: Link2 },
  { title: "Create Event", url: "/create", icon: Plus },
  { title: "Contributions", url: "/contributions", icon: Heart },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: HelpCircle },
];

export function TopNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Don't close if clicking on AlertDialog elements
      if (target instanceof Element && target.closest('[role="alertdialog"]')) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleNavClick = (url: string) => {
    navigate(url);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Notification Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/notifications")}
        className="relative hover:bg-muted"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {/* Notification badge - can be dynamic */}
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
      </Button>

      {/* User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium hidden sm:block">
            {user?.email?.split("@")[0] || "User"}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-popover shadow-lg z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">{user?.email?.split("@")[0] || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>

            {/* Navigation Items */}
            <div className="py-2 max-h-64 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavClick(item.url)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Theme Toggle & Logout */}
            <div className="border-t border-border py-2">
              {/* Theme Toggle */}
              {mounted && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    {resolvedTheme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span>{resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <Switch
                    checked={resolvedTheme === "light"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              )}

              {/* Logout */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
