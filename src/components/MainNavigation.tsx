import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "react-router-dom";
import { Heart, ListMusic, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MainNavigationProps {
  currentTab: string;
  onTabChange: (tab: "search" | "library") => void;
}

const navItems = [
  { name: "Início", href: "/", icon: Home },
  { name: "Favoritos", href: "/favorites", icon: Heart },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
];

export const MainNavigation = ({ currentTab, onTabChange }: MainNavigationProps) => {
  const location = useLocation();
  const isIndexPage = location.pathname === '/';

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
      {/* Abas de Busca/Biblioteca (Movidas para AppLayout, mas mantemos a estrutura de Tabs aqui para o Index) */}
      {isIndexPage && (
        <Tabs value={currentTab} onValueChange={(value) => onTabChange(value as "search" | "library")}>
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-gray-800 text-gray-400">
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="library">Minha Biblioteca</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Links de Navegação (Sempre visíveis) */}
      <div className={cn("flex gap-2", isIndexPage ? "sm:ml-4" : "w-full justify-center")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "transition-colors",
                  isActive ? "bg-purple-600 hover:bg-purple-500" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
              >
                <Icon size={18} className="mr-2" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};