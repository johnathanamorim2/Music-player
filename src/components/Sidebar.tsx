import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Início", href: "/", icon: Home },
  { name: "Favoritos", href: "/favorites", icon: Heart },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground p-4 flex flex-col border-r border-sidebar-border fixed left-0 top-0 z-40 hidden md:flex">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary">Music Finder</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center p-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};