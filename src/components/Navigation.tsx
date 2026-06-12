"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Trophy, 
  ShieldCheck, 
  Wallet, 
  History, 
  UserCircle, 
  Settings, 
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Fingerprint,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Challenges', href: '/challenges', icon: Trophy },
  { name: 'Competitions', href: '/competitions', icon: Trophy },
  { name: 'Ranking', href: '/ranking', icon: Users },
  { name: 'Accounts', href: '/accounts', icon: ShieldCheck },
  { name: 'MT5 Credentials', href: '/mt5-account', icon: Terminal },
  { name: 'Payouts', href: '/payouts', icon: Wallet },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'History', href: '/history', icon: History },
];

const secondaryItems = [
  { name: 'KYC Verification', href: '/kyc', icon: Fingerprint },
  { name: 'Profile', href: '/profile', icon: UserCircle },
  { name: 'Rules', href: '/rules', icon: Settings },
  { name: 'Support', href: '/support', icon: HelpCircle },
];

export function Navigation() {
  const pathname = usePathname();
  const { logout, userData } = useAuth();

  return (
    <div className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <TrendingUp className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tight text-primary">PrimeFunded</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary/10 text-primary border-r-2 border-primary rounded-r-none" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-10 pt-10 border-t border-border space-y-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
        {secondaryItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary/10 text-primary border-r-2 border-primary rounded-r-none" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <div className="mt-auto bg-secondary/50 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <UserCircle className="text-primary w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{userData?.name || 'Trader'}</p>
            <p className="text-xs text-muted-foreground truncate">{userData?.tier || 'Free Tier'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
          <Link href="/challenges">Upgrade Plan <ChevronRight className="w-3 h-3 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}
