'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, Clock, Coins, TrendingUp, Lock, Zap } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ConnectWallet } from '@/components/connect-wallet';

const navItems = [
  { title: 'Swap', href: '/swap', icon: ArrowLeftRight },
  { title: 'DCA', href: '/dca', icon: Clock },
  { title: 'Tokens', href: '/tokens', icon: Coins },
  { title: 'Market', href: '/market', icon: TrendingUp },
  { title: 'Staking', href: '/staking', icon: Lock },
  { title: 'Paymaster', href: '/paymaster', icon: Zap },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="font-semibold text-lg">
          AVNU SDK
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <ConnectWallet />
      </SidebarFooter>
    </Sidebar>
  );
}
