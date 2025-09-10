import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Wrench,
  Users,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Veículos", url: "/veiculos", icon: Truck },
  { title: "Serviços", url: "/servicos", icon: ClipboardList },
  { title: "Despesas", url: "/despesas", icon: Wrench },
  { title: "Motoristas", url: "/motoristas", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-card",
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
            className={cn(
              "flex items-center space-x-2 rounded px-2 py-2 text-sm mb-1",
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}