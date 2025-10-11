"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  BrainCircuit,
  History,
  Phone,
  Settings,
  LayoutDashboard,
  Bot,
} from "lucide-react";

const titles: { [key: string]: { title: string; icon: React.ElementType } } = {
  "/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  "/chatbot": { title: "Chatbot", icon: Bot },
  "/history": { title: "History", icon: History },
  "/offline": { title: "Offline Support", icon: Phone },
  "/settings": { title: "Settings", icon: Settings },
};

export function AppHeader() {
  const pathname = usePathname();
  const current =
    Object.keys(titles).find((key) => pathname.startsWith(key)) || "";
  const { title, icon: Icon } = titles[current] || {
    title: "Analysis",
    icon: BrainCircuit,
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  );
}
