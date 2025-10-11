"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Image,
  History,
  Phone,
  Settings,
  Bot,
} from "lucide-react";

const navItems = [
  { href: "/image-analysis", icon: Image, label: "Image Analysis", tooltip: "Image Analysis" },
  { href: "/chatbot", icon: Bot, label: "Ask Verdant", tooltip: "Ask Verdant" },
  { href: "/history", icon: History, label: "History", tooltip: "History" },
  { href: "/offline", icon: Phone, label: "Offline Support", tooltip: "Offline Support" },
  { href: "/settings", icon: Settings, label: "Settings", tooltip: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={{ children: item.tooltip }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
