// src/components/layout/Sidebar.tsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Menu,
  LogOut,
  UserCircle // <--- Adicionar ícone para Perfil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Veículos", url: "/veiculos", icon: Truck },
  // { title: "Motoristas", url: "/motoristas", icon: Users }, // Removido
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    // Tratamento especial para evitar que '/' corresponda a tudo
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
    } else {
        navigate('/');
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-10 flex h-screen flex-col border-r bg-card transition-all",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        {!collapsed && (
          <h1 className="text-lg font-bold">MunckGest</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"} // Adiciona 'end' apenas para o Dashboard
            className={cn(
              "flex items-center space-x-2 rounded px-2 py-2 text-sm mb-1",
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            title={item.title}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Ações do Utilizador (Perfil e Sair) */}
      <div className={cn("p-2 border-t", collapsed ? "p-1" : "p-2")}>
        {/* Link para Perfil */}
        <NavLink
            to="/perfil"
            className={cn(
              "flex items-center space-x-2 rounded px-2 py-2 text-sm mb-1 w-full justify-start",
               isActive('/perfil') // Usa isActive para destacar se estiver na página de perfil
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            title="Meu Perfil"
          >
            <UserCircle className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Meu Perfil</span>}
          </NavLink>

        {/* Botão Sair */}
        <Button
          variant="ghost"
          className="w-full justify-start mt-1" // Adicionado mt-1 para espaço
          onClick={handleLogout}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  );
}
