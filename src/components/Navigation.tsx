"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  ShieldCheck, 
  Wallet, 
  History, 
  UserCircle, 
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  Terminal,
  Shield,
  BookOpen,
  Gift,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Challenges', href: '/challenges', icon: Trophy },
  { name: 'Referral', href: '/referral', icon: Users },
  { name: 'Giveaway', href: '/giveaway', icon: Gift },
  { name: 'Accounts', href: '/accounts', icon: ShieldCheck },
  { name: 'MT5 Credentials', href: '/mt5-account', icon: Terminal },
  { name: 'Payouts', href: '/payouts', icon: Wallet },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'History', href: '/history', icon: History },
];

const secondaryItems = [
  { name: 'Rules', href: '/rules', icon: BookOpen },
  { name: 'KYC Verification', href: '/kyc', icon: FingerprintIcon },
  { name: 'Profile', href: '/profile', icon: UserCircle },
  { name: 'Support', href: '/support', icon: HelpCircle },
];

function FingerprintIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="cursor-pointer"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.3 3" />
      <path d="M7 10.78c0-1.2.2-2.4.6-3.5" />
      <path d="M11 5.48a6.39 6.39 0 0 1 5 1.5" />
      <path d="M5.22 14.82a10 10 0 0 0 1.18-4.04" />
      <path d="M14 2.15a13.3 13.3 0 0 1 3.56 1.85" />
      <path d="M2 13.5a10 10 0 0 0 5 8.66" />
      <path d="M18 10.25a6.39 6.39 0 0 0-2-3.25" />
      <path d="M6 18c.35 1.1.84 2.14 1.45 3.1" />
      <path d="M20 13.5a10 10 0 0 1-5 8.66" />
      <path d="M12 22s-4-2-4-10a4 4 0 1 1 8 0c0 8-4 10-4 10Z" />
    </svg>
  )
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userData, user } = useAuth();

  // Prefetch main routes on app startup
  useEffect(() => {
    const routesToPrefetch = [
      '/dashboard',
      '/challenges',
      '/referral',
      '/profile',
      '/payouts',
      '/accounts',
      '/mt5-account'
    ];
    routesToPrefetch.forEach(route => {
      router.prefetch(route);
    });
  }, [router]);

  return (
    <div className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col p-6 overflow-y-auto shrink-0 custom-scrollbar">
      <Link href="/dashboard" className="flex items-center gap-2 mb-10 px-2 cursor-pointer transition-opacity hover:opacity-80">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <TrendingUp className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tight text-primary">PrimeFunded</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer",
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
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer",
              pathname === item.href 
                ? "bg-primary/10 text-primary border-r-2 border-primary rounded-r-none" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
        
        {user && (
          <Link
            href="/admin"
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer",
              pathname === "/admin" 
                ? "bg-destructive/10 text-destructive border-r-2 border-destructive rounded-r-none" 
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            )}
          >
            <Shield className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
        
        <button
          onClick={() => {
            logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4 cursor-pointer"
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
            <p className="text-xs text-muted-foreground truncate">{userData?.tier || 'Bronze Tier'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer" asChild>
          <Link href="/challenges">Upgrade Plan <ChevronRight className="w-3 h-3 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}
