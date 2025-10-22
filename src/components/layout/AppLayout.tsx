import { ReactNode, useState } from "react";
import { Sidebar} from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={cn(
          "flex-1 p-6 overflow-auto transition-all",
          collapsed ? "ml-16" : "ml-56"
        )}
      >
        {children}
      </main>
    </div>
  );
}